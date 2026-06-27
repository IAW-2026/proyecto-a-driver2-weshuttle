const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../seed-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const { passengers = [], reservations = [] } = manifest;

console.log(`Passengers count: ${passengers.length}`);
console.log(`Reservations count: ${reservations.length}`);

const confirmed = reservations.filter(r => r.pool_id && r.reservation_status === 'CONFIRMED');
console.log(`Confirmed reservations with pool_id: ${confirmed.length}`);

const reservationsByPool = {};
for (const r of confirmed) {
  if (!reservationsByPool[r.pool_id]) {
    reservationsByPool[r.pool_id] = [];
  }
  reservationsByPool[r.pool_id].push(r);
}

const poolIds = Object.keys(reservationsByPool);
console.log(`Unique pools count: ${poolIds.length}`);

const counts = poolIds.map(id => reservationsByPool[id].length);
console.log(`Max reservations in a single pool: ${Math.max(...counts)}`);
console.log(`Min reservations in a single pool: ${Math.min(...counts)}`);
console.log(`Avg reservations in a single pool: ${counts.reduce((a,b)=>a+b, 0) / counts.length}`);

console.log('List of pools and their reservation counts:');
for (const [poolId, list] of Object.entries(reservationsByPool).slice(0, 10)) {
  console.log(`  - ${poolId}: ${list.length} passengers`);
}
if (poolIds.length > 10) console.log('  ...');
