// Run once from the voltshare-backend folder:  node reset-passwords.js
// Re-hashes passwords properly with bcrypt so login works.
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

const NEW_PASSWORD = '12345678'; // change if you want a different demo password

(async () => {
  try {
    const hash = await bcrypt.hash(NEW_PASSWORD, 10);
    // Fixes the seeded users (1-3) and the plain-text one (id 5).
    // User 4 (demo1@gmail.com) was registered through the app, so it is also reset for a known password.
    const [r] = await pool.execute(
      `UPDATE users SET password_hash = ? WHERE email IN (?, ?, ?, ?, ?)`,
      [hash, 'sharma@voltshare.com', 'rahul@voltshare.com', 'admin@voltshare.com', 'demo1@gmail.com', 'demo2@gmail.com']
    );
    console.log(`Updated ${r.affectedRows} users. Password for all of them is now: ${NEW_PASSWORD}`);
  } catch (e) {
    console.error('Failed:', e.message);
  } finally {
    await pool.end();
  }
})();