const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const pool = require('./config/db');
const { verifyToken, authorizeRoles } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 0. HELPERS: TRANSACTIONS & SINGLE SESSION OTP
// ==========================================

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Runs `work(conn)` inside a MySQL transaction (commit on success, rollback on any error)
async function withTransaction(work) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const result = await work(conn);
        await conn.commit();
        return result;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

const generateOtp = () => crypto.randomInt(1000, 10000).toString(); // 4 digits, 1000-9999

// Issues a NEW single Session PIN for a driver and keeps every still-open request on that same PIN
async function issueSessionOtp(conn, userId) {
    const otp = generateOtp();
    await conn.execute(`UPDATE users SET session_otp = ? WHERE user_id = ?`, [otp, userId]);
    await conn.execute(
        `UPDATE bookings SET start_otp = ? WHERE driver_id = ? AND status IN ('REQUESTED', 'APPROVED')`,
        [otp, userId]
    );
    return otp;
}

// Reads the driver's current Session PIN (row-locked); creates one if the driver has none yet
async function getOrCreateSessionOtp(conn, userId) {
    const [rows] = await conn.execute(`SELECT session_otp FROM users WHERE user_id = ? FOR UPDATE`, [userId]);
    if (rows.length === 0) throw new HttpError(404, 'User not found');
    return rows[0].session_otp || issueSessionOtp(conn, userId);
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register User (DRIVER, HOST, ADMIN)
app.post('/api/auth/register', async (req, res) => {
    const { full_name, email, password, phone, role } = req.body;
    try {
        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            `INSERT INTO users (full_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)`,
            [full_name, email, password_hash, phone, role || 'DRIVER']
        );
        res.status(201).json({ message: 'User registered successfully', user_id: result.insertId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.execute(`SELECT * FROM users WHERE email = ?`, [email]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { user_id: user.user_id, role: user.role, full_name: user.full_name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // DRIVER login => ONE 4-digit Session PIN, shared by every request sent during this session
        let session_otp;
        if (user.role === 'DRIVER') {
            session_otp = await withTransaction((conn) => issueSessionOtp(conn, user.user_id));
        }

        res.json({ token, user: { user_id: user.user_id, full_name: user.full_name, role: user.role, wallet_balance: user.wallet_balance, session_otp } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. DRIVER: VEHICLE & CHARGER DISCOVERY
// ==========================================

// Driver's current Session PIN (survives page refresh; creates one if the driver has none yet)
app.get('/api/session/otp', verifyToken, authorizeRoles('DRIVER'), async (req, res) => {
    try {
        // Plain read first (this endpoint is polled); only lock + create when the driver has no PIN yet
        const [rows] = await pool.execute(`SELECT session_otp FROM users WHERE user_id = ?`, [req.user.user_id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const session_otp = rows[0].session_otp || await withTransaction((conn) => getOrCreateSessionOtp(conn, req.user.user_id));
        res.json({ session_otp });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
});

// ---- Profile (any logged-in role): editable name + optional description ----
app.get('/api/profile', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT user_id, full_name, email, phone, role, description FROM users WHERE user_id = ?`,
            [req.user.user_id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/profile', verifyToken, async (req, res) => {
    const full_name = String(req.body.full_name ?? '').trim();
    const rawDescription = req.body.description;
    const description = rawDescription == null ? '' : String(rawDescription).trim();

    if (!full_name) return res.status(400).json({ error: 'Name is required.' });
    if (full_name.length > 100) return res.status(400).json({ error: 'Name must be 100 characters or fewer.' });
    if (description.length > 500) return res.status(400).json({ error: 'Description must be 500 characters or fewer.' });

    try {
        // Description is optional: an empty value is stored as NULL
        await pool.execute(
            `UPDATE users SET full_name = ?, description = ? WHERE user_id = ?`,
            [full_name, description || null, req.user.user_id]
        );
        res.json({
            message: 'Profile updated.',
            user: { user_id: req.user.user_id, full_name, role: req.user.role, description: description || null }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add EV Profile
app.post('/api/vehicles', verifyToken, authorizeRoles('DRIVER'), async (req, res) => {
    const { vehicle_name, vehicle_type, connector_type, battery_capacity_kwh } = req.body;
    try {
        const [result] = await pool.execute(
            `INSERT INTO vehicles (driver_id, vehicle_name, vehicle_type, connector_type, battery_capacity_kwh) VALUES (?, ?, ?, ?, ?)`,
            [req.user.user_id, vehicle_name, vehicle_type, connector_type, battery_capacity_kwh]
        );
        res.status(201).json({ message: 'Vehicle added', vehicle_id: result.insertId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Discover Nearby Chargers (Privacy-Protected: Hides full_address during search)
app.get('/api/chargers/nearby', verifyToken, async (req, res) => {
    const { lat, lng, radius_km = 5, connector_type, sos_only } = req.query;
    try {
        let query = `
            SELECT 
                c.charger_id, c.title, c.area_name, c.latitude, c.longitude,
                c.connector_type, c.power_kw, c.price_per_kwh, c.is_available_now,
                u.full_name AS host_name,
                ROUND((6371 * acos(
                    cos(radians(?)) * cos(radians(c.latitude)) * 
                    cos(radians(c.longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(c.latitude))
                )), 2) AS distance_km
            FROM host_chargers c
            JOIN users u ON c.host_id = u.user_id
            WHERE 1=1
        `;
        const params = [lat, lng, lat];

        if (connector_type) {
            query += ` AND c.connector_type = ?`;
            params.push(connector_type);
        }
        if (sos_only === 'true') {
            query += ` AND c.is_available_now = TRUE`;
        }

        query += ` HAVING distance_km <= ? ORDER BY distance_km ASC`;
        params.push(Number(radius_km));

        const [chargers] = await pool.execute(query, params);
        res.json(chargers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. HOST ("SHARMA UNCLE"): CHARGER MANAGEMENT
// ==========================================

// Register Home Charger (Enforces ₹11.00 - ₹16.00 Fair-Price Guardrail)
app.post('/api/chargers', verifyToken, authorizeRoles('HOST'), async (req, res) => {
    const { title, area_name, full_address, latitude, longitude, connector_type, power_kw, price_per_kwh } = req.body;

    if (price_per_kwh < 11.00 || price_per_kwh > 16.00) {
        return res.status(400).json({
            error: 'Fair-Price Guardrail Violation: Rate must be between ₹11.00/kWh (Floor) and ₹16.00/kWh (Ceiling).'
        });
    }

    try {
        const [result] = await pool.execute(
            `INSERT INTO host_chargers 
            (host_id, title, area_name, full_address, latitude, longitude, connector_type, power_kw, price_per_kwh) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.user_id, title, area_name, full_address, latitude, longitude, connector_type, power_kw, price_per_kwh]
        );
        res.status(201).json({ message: 'Host charger listed successfully', charger_id: result.insertId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Instant Availability Toggle (Online / Offline)
app.patch('/api/chargers/:id/toggle', verifyToken, authorizeRoles('HOST'), async (req, res) => {
    const { is_available_now } = req.body;
    try {
        await pool.execute(
            `UPDATE host_chargers SET is_available_now = ? WHERE charger_id = ? AND host_id = ?`,
            [is_available_now, req.params.id, req.user.user_id]
        );
        res.json({ message: `Charger availability updated to ${is_available_now ? 'ONLINE' : 'OFFLINE'}` });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ==========================================
// 4. BOOKINGS, PRIVACY UNLOCK & OTP FLOW
// ==========================================

// Create Booking or SOS Emergency Request
// - Every request from a driver carries the driver's ONE Session PIN (no per-booking OTP).
// - Anti-spam: 1 driver -> 1 active request per host/charger.
app.post('/api/bookings', verifyToken, authorizeRoles('DRIVER'), async (req, res) => {
    const { charger_id, vehicle_id, slot_start, slot_end, is_sos_emergency } = req.body;
    if (!charger_id) return res.status(400).json({ error: 'charger_id is required' });

    try {
        const { booking_id, otp } = await withTransaction(async (conn) => {
            // Row-lock the driver so two rapid clicks can never both pass the duplicate check
            const otp = await getOrCreateSessionOtp(conn, req.user.user_id);

            const [chargers] = await conn.execute(`SELECT charger_id FROM host_chargers WHERE charger_id = ?`, [charger_id]);
            if (chargers.length === 0) throw new HttpError(404, 'Charger not found');

            const [existing] = await conn.execute(
                `SELECT booking_id FROM bookings
                 WHERE driver_id = ? AND charger_id = ? AND status IN ('REQUESTED', 'APPROVED', 'CHARGING_ACTIVE')
                 LIMIT 1`,
                [req.user.user_id, charger_id]
            );
            if (existing.length > 0) throw new HttpError(400, 'Request already sent to this host');

            const [result] = await conn.execute(
                `INSERT INTO bookings (driver_id, charger_id, vehicle_id, slot_start, slot_end, is_sos_emergency, start_otp, status)
                 VALUES (?, ?, ?, COALESCE(?, NOW()), COALESCE(?, DATE_ADD(NOW(), INTERVAL 1 HOUR)), ?, ?, 'REQUESTED')`,
                [req.user.user_id, charger_id, vehicle_id, slot_start || null, slot_end || null, is_sos_emergency || false, otp]
            );
            return { booking_id: result.insertId, otp };
        });

        res.status(201).json({
            message: 'Request sent. Full address will unlock once the Host accepts.',
            booking_id,
            session_otp: otp,
            start_otp: otp // kept for backward compatibility with older clients
        });
    } catch (err) {
        res.status(err.status || 400).json({ error: err.message });
    }
});

// Host Accepts a Request (Unlocks Exact Address & Phone for Driver)
// Several hosts can accept the same driver's request at the same time; the driver then picks the closest one.
app.patch('/api/bookings/:id/approve', verifyToken, authorizeRoles('HOST'), async (req, res) => {
    try {
        const [result] = await pool.execute(
            `UPDATE bookings b
             JOIN host_chargers c ON b.charger_id = c.charger_id
             SET b.status = 'APPROVED'
             WHERE b.booking_id = ? AND c.host_id = ? AND b.status = 'REQUESTED'`,
            [req.params.id, req.user.user_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Request not found, already handled, or withdrawn because the driver connected to another host.' });
        }
        res.json({ message: 'Request ACCEPTED. Exact house address is now unlocked for the driver.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get Driver's Bookings (Shows full_address ONLY if status is APPROVED, CHARGING_ACTIVE, or COMPLETED)
// Optional ?lat=&lng= adds distance_km so the "Accepted Hosts" list can be sorted by closeness.
app.get('/api/bookings/my', verifyToken, authorizeRoles('DRIVER'), async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
        const distanceSql = hasLocation
            ? `ROUND((6371 * acos(LEAST(1, 
                    cos(radians(?)) * cos(radians(c.latitude)) * 
                    cos(radians(c.longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(c.latitude))
               ))), 2)`
            : 'NULL';
        const params = hasLocation ? [lat, lng, lat, req.user.user_id] : [req.user.user_id];

        const [rows] = await pool.execute(
            `SELECT 
                b.booking_id, b.charger_id, b.slot_start, b.slot_end, b.is_sos_emergency, b.start_otp, b.status, b.created_at,
                l.actual_end_time, l.units_consumed_kwh, l.total_amount,
                c.title, c.area_name, c.price_per_kwh, c.connector_type, c.power_kw,
                u.full_name AS host_name,
                ${distanceSql} AS distance_km,
                CASE 
                    WHEN b.status IN ('APPROVED', 'CHARGING_ACTIVE', 'COMPLETED') THEN c.full_address 
                    ELSE '🔒 Hidden until Host approves booking' 
                END AS unlocked_address,
                CASE 
                    WHEN b.status IN ('APPROVED', 'CHARGING_ACTIVE', 'COMPLETED') THEN u.phone 
                    ELSE '🔒 Hidden' 
                END AS host_phone
             FROM bookings b
             JOIN host_chargers c ON b.charger_id = c.charger_id
             JOIN users u ON c.host_id = u.user_id
             LEFT JOIN charging_logs l ON l.booking_id = b.booking_id
             WHERE b.driver_id = ?
             ORDER BY b.created_at DESC`,
            params
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Host's Bookings + billing (powers Host dispatcher and Host History)
// NOTE: the driver's OTP is deliberately NOT returned here, so a host can only start a session by
// actually receiving the PIN from the driver in person.
app.get('/api/bookings/host', verifyToken, authorizeRoles('HOST'), async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT
                b.booking_id, b.driver_id, b.charger_id, b.slot_start, b.slot_end, b.is_sos_emergency, b.status, b.created_at,
                c.title, c.area_name, c.price_per_kwh, c.full_address, c.power_kw,
                d.full_name AS driver_name, d.phone AS driver_phone,
                l.units_consumed_kwh, l.total_amount, l.host_payout, l.platform_fee, l.actual_end_time
             FROM bookings b
             JOIN host_chargers c ON b.charger_id = c.charger_id
             JOIN users d ON b.driver_id = d.user_id
             LEFT JOIN charging_logs l ON l.booking_id = b.booking_id
             WHERE c.host_id = ?
             ORDER BY b.created_at DESC`,
            [req.user.user_id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify the driver's 4-Digit Session OTP & Start Charging Session
// On success the driver's OTHER open requests (REQUESTED / APPROVED at other hosts) are deleted in the
// same transaction, so those hosts stop seeing them and the driver's history stays clean.
app.post('/api/bookings/:id/start-session', verifyToken, authorizeRoles('HOST'), async (req, res) => {
    const otp = String(req.body.otp ?? '').trim();
    const bookingId = req.params.id;
    const conn = await pool.getConnection();

    try {
        // Find the driver (and confirm this booking belongs to one of this host's chargers)
        const [peek] = await conn.execute(
            `SELECT b.driver_id
             FROM bookings b JOIN host_chargers c ON b.charger_id = c.charger_id
             WHERE b.booking_id = ? AND c.host_id = ?`,
            [bookingId, req.user.user_id]
        );
        if (peek.length === 0) {
            throw new HttpError(404, 'Booking not found. If the driver already connected to another host, this request was withdrawn.');
        }
        const driverId = peek[0].driver_id;

        await conn.beginTransaction();

        // Lock the driver first (same order as POST /api/bookings) so two hosts can never both start
        // the same driver at once, and concurrent deletes cannot deadlock.
        await conn.execute(`SELECT user_id FROM users WHERE user_id = ? FOR UPDATE`, [driverId]);

        const [rows] = await conn.execute(
            `SELECT booking_id, status, start_otp FROM bookings
             WHERE booking_id = ? AND charger_id IN (SELECT charger_id FROM host_chargers WHERE host_id = ?)
             FOR UPDATE`,
            [bookingId, req.user.user_id]
        );
        if (rows.length === 0) {
            throw new HttpError(409, 'This request is no longer available. The driver may have connected to another host.');
        }
        if (rows[0].status !== 'APPROVED') {
            throw new HttpError(400, `Booking is ${rows[0].status}. Accept the request first, then verify the driver's OTP.`);
        }
        if (!/^\d{4}$/.test(otp) || otp !== String(rows[0].start_otp)) {
            throw new HttpError(400, 'Invalid 4-Digit Start OTP!');
        }

        // 1. This host's booking becomes the live session
        await conn.execute(
            `UPDATE bookings SET status = 'CHARGING_ACTIVE', slot_start = NOW(), slot_end = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE booking_id = ?`,
            [bookingId]
        );

        // 2. Auto-cancel everything else the driver had pending (Host A, C, D ...)
        const [removed] = await conn.execute(
            `DELETE FROM bookings WHERE driver_id = ? AND booking_id != ? AND status IN ('REQUESTED', 'APPROVED')`,
            [driverId, bookingId]
        );

        await conn.commit();
        res.json({
            message: 'OTP Verified! Status changed to CHARGING_ACTIVE.',
            cancelled_requests: removed.affectedRows
        });
    } catch (err) {
        await conn.rollback();
        res.status(err.status || 500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// ==========================================
// 5. SMART BILLING & SESSION COMPLETION
// ==========================================

// Complete Charging Session & Generate Itemized Bill (Transaction Safe)
app.post('/api/bookings/:id/complete-session', verifyToken, authorizeRoles('HOST'), async (req, res) => {
    const { units_consumed_kwh } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Fetch locked rate from host_chargers (prevents post-SOS price surge)
        const [rows] = await connection.execute(
            `SELECT b.booking_id, c.host_id, c.price_per_kwh 
             FROM bookings b 
             JOIN host_chargers c ON b.charger_id = c.charger_id 
             WHERE b.booking_id = ? AND b.status = 'CHARGING_ACTIVE' AND c.host_id = ?
             FOR UPDATE`,
            [req.params.id, req.user.user_id]
        );

        if (rows.length === 0) {
            throw new Error('Active charging session not found for this booking.');
        }

        const { host_id, price_per_kwh } = rows[0];
        const units = parseFloat(units_consumed_kwh);
        if (!Number.isFinite(units) || units < 0) {
            throw new Error('Enter a valid number of kWh consumed.');
        }
        const host_payout = +(units * parseFloat(price_per_kwh)).toFixed(2);
        const platform_fee = +(host_payout * 0.10).toFixed(2); // 10% platform convenience fee
        const total_amount = +(host_payout + platform_fee).toFixed(2);

        // Breakdown for display (Assuming ₹8/kWh domestic electricity baseline)
        const base_electricity_cost = +(units * 8.00).toFixed(2);
        const net_passive_profit = +(host_payout - base_electricity_cost).toFixed(2);

        // 1. Insert Charging Log
        await connection.execute(
            `INSERT INTO charging_logs (booking_id, actual_end_time, units_consumed_kwh, total_amount, host_payout, platform_fee)
             VALUES (?, NOW(), ?, ?, ?, ?)`,
            [req.params.id, units, total_amount, host_payout, platform_fee]
        );

        // 2. Mark Booking COMPLETED
        await connection.execute(`UPDATE bookings SET status = 'COMPLETED' WHERE booking_id = ?`, [req.params.id]);

        // 3. Credit Host Wallet
        await connection.execute(`UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?`, [host_payout, host_id]);

        await connection.commit();

        res.json({
            message: 'Charging session completed & bill generated',
            bill_summary: {
                units_consumed_kwh: units,
                rate_per_kwh: price_per_kwh,
                electricity_bill_recovery: base_electricity_cost,
                sharma_uncle_net_profit: net_passive_profit,
                host_total_payout: host_payout,
                platform_fee,
                driver_total_payable: total_amount
            }
        });
    } catch (err) {
        await connection.rollback();
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// ==========================================
// 6. ADMIN: GREEN IMPACT & REVENUE ANALYTICS
// ==========================================

app.get('/api/admin/analytics', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(log_id) AS completed_sessions,
                COALESCE(SUM(units_consumed_kwh), 0) AS total_kwh_shared,
                ROUND(COALESCE(SUM(units_consumed_kwh), 0) * 0.82, 2) AS co2_saved_kg,
                COALESCE(SUM(platform_fee), 0) AS total_platform_revenue,
                COALESCE(SUM(host_payout), 0) AS total_host_earnings
            FROM charging_logs
        `);
        res.json(stats[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Safety net: adds the new users columns on first boot if you have not run the sql/ files yet.
async function ensureColumn(table, column, ddl) {
    const [cols] = await pool.execute(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    if (cols.length === 0) {
        await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
        console.log(`Added ${table}.${column} column.`);
    }
}

async function ensureSchema() {
    try {
        await ensureColumn('users', 'session_otp', 'session_otp CHAR(4) NULL DEFAULT NULL');
        await ensureColumn('users', 'description', 'description VARCHAR(500) NULL DEFAULT NULL');
    } catch (err) {
        console.warn('Could not verify/add new users columns. Run the files in sql/ manually:', err.message);
    }
}

const PORT = process.env.PORT || 5000;
ensureSchema().then(() => {
    app.listen(PORT, () => console.log(`VoltShare Backend running on http://localhost:${PORT}`));
});