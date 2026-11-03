// Run once from the voltshare-backend folder:   node seed-data.js
// Adds sample Hosts (each with 1-2 chargers) and Users (DRIVER) to voltshare_db.
// Every seeded account gets a proper bcrypt hash, so it can log in with SEED_PASSWORD.
// Safe to run again: emails that already exist are skipped.

const bcrypt = require('bcryptjs');
const pool = require('./config/db');

const HOST_COUNT = 35;   // change as you like (30-40)
const USER_COUNT = 25;   // change as you like (20-30)
const SEED_PASSWORD = '12345678';

// Charger search in the app is centred on lat 13.445, lng 77.602
const CENTER = { lat: 13.445, lng: 77.602 };

const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Rohan', 'Karthik', 'Suresh', 'Ramesh', 'Mahesh', 'Naveen',
  'Priya', 'Ananya', 'Divya', 'Meera', 'Kavya', 'Lakshmi', 'Sneha', 'Pooja', 'Revathi', 'Swathi',
  'Imran', 'Sayed', 'Farhan', 'Zoya', 'Ayesha', 'Irfan', 'Nikhil', 'Harsha', 'Manoj', 'Deepa'];
const LAST = ['Sharma', 'Reddy', 'Naidu', 'Rao', 'Kumar', 'Verma', 'Gupta', 'Shaik', 'Khan', 'Patel',
  'Iyer', 'Nair', 'Das', 'Singh', 'Joshi', 'Menon', 'Chowdary', 'Prasad', 'Hegde', 'Murthy'];
const AREAS = ['Green Park Colony', 'Lake View Layout', 'Temple Road', 'Gandhi Nagar', 'Rose Garden Enclave',
  'Tech Park Residency', 'Shanti Nagar', 'Hill View Colony', 'Railway Colony', 'Market Street Block'];
const CONNECTORS = [
  { type: '15A_Socket', kw: [2.2, 3.3] },
  { type: 'Type2_Wallbox', kw: [7.2, 11] },
  { type: 'CCS2', kw: [30, 50] }
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const between = (a, b) => a + Math.random() * (b - a);
const slug = (s) => s.toLowerCase().replace(/[^a-z]/g, '');

let phoneCounter = 7000000000 + Math.floor(Math.random() * 1000000);
const nextPhone = () => String(phoneCounter++); // unique 10-digit numbers

async function createUser(conn, hash, role, index) {
  const first = pick(FIRST);
  const last = pick(LAST);
  const full_name = `${first} ${last}`;
  const email = `${slug(first)}.${slug(last)}${index}.${role.toLowerCase()}@voltshare.com`;

  const [existing] = await conn.execute('SELECT user_id FROM users WHERE email = ?', [email]);
  if (existing.length) return null;

  const wallet = role === 'DRIVER' ? Math.round(between(300, 3000)) : 0;
  const [r] = await conn.execute(
    'INSERT INTO users (full_name, email, password_hash, phone, role, wallet_balance) VALUES (?, ?, ?, ?, ?, ?)',
    [full_name, email, hash, nextPhone(), role, wallet]
  );
  return { user_id: r.insertId, full_name };
}

async function createCharger(conn, hostId, hostName, n) {
  const area = pick(AREAS);
  const c = pick(CONNECTORS);
  const power = pick(c.kw);
  const price = Math.round(between(11, 16) * 2) / 2; // 11.0 to 16.0 in 0.5 steps (within the guardrail)
  const lat = (CENTER.lat + between(-0.04, 0.04)).toFixed(6); // roughly within 5 km
  const lng = (CENTER.lng + between(-0.04, 0.04)).toFixed(6);
  const house = Math.floor(between(1, 120));

  await conn.execute(
    `INSERT INTO host_chargers
     (host_id, title, area_name, full_address, latitude, longitude, connector_type, power_kw, price_per_kwh)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [hostId, `${power} kW ${c.type.replace('_', ' ')} - ${hostName.split(' ')[0]}'s home${n > 1 ? ' #' + n : ''}`,
      area, `House #${house}, ${area}`, lat, lng, c.type, power, price]
  );
}

(async () => {
  const conn = await pool.getConnection();
  try {
    const hash = await bcrypt.hash(SEED_PASSWORD, 10);
    let hosts = 0, users = 0, chargers = 0;

    for (let i = 1; i <= HOST_COUNT; i++) {
      const h = await createUser(conn, hash, 'HOST', i);
      if (!h) continue;
      hosts++;
      const howMany = Math.random() < 0.3 ? 2 : 1;
      for (let n = 1; n <= howMany; n++) {
        await createCharger(conn, h.user_id, h.full_name, n);
        chargers++;
      }
    }

    for (let i = 1; i <= USER_COUNT; i++) {
      const u = await createUser(conn, hash, 'DRIVER', i);
      if (u) users++;
    }

    console.log(`Added ${hosts} hosts, ${chargers} chargers and ${users} users.`);
    console.log(`Login with any seeded email, e.g. ones ending in .host@voltshare.com or .driver@voltshare.com, password: ${SEED_PASSWORD}`);
  } catch (e) {
    console.error('Seeding failed:', e.message);
  } finally {
    conn.release();
    await pool.end();
  }
})();