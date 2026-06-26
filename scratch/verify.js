const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Starting database validation...');

  const totalPools = await prisma.pool.count();
  console.log(`Total pools in database: ${totalPools}`);

  const totalPassengers = await prisma.operationalManifestSnapshotPassenger.count();
  console.log(`Total passengers in operational manifests: ${totalPassengers}`);

  // Count drivers
  const totalDrivers = await prisma.driver.count();
  console.log(`Total drivers in database: ${totalDrivers}`);

  // Count by driver
  const drivers = await prisma.driver.findMany({
    include: {
      _count: {
        select: { pools: true }
      }
    }
  });

  console.log('\nPools count by driver:');
  let zeroPoolsActiveCount = 0;
  let juanPoolsCount = 0;

  for (const drv of drivers) {
    console.log(`  - ${drv.full_name} (${drv.clerk_user_id}, status: ${drv.status}, verification: ${drv.verification_status}): ${drv._count.pools} pools`);
    
    if (drv.clerk_user_id === 'user_3EYQtdZpi4fPlmXGq4EKEa1onL0') {
      juanPoolsCount = drv._count.pools;
    }
    
    if (drv.status === 'ACTIVE' && drv.verification_status === 'APPROVED' && drv._count.pools === 0) {
      zeroPoolsActiveCount++;
    }
  }

  console.log(`\nActive approved drivers with 0 pools: ${zeroPoolsActiveCount}`);
  console.log(`Juan Lopez pools: ${juanPoolsCount}`);

  // Check if passenger counts are consistent
  const pools = await prisma.pool.findMany({
    include: {
      _count: {
        select: { manifest_passengers: true }
      }
    }
  });

  let anomalies = 0;
  for (const pool of pools) {
    if (pool.current_passengers > 15) {
      console.log(`🚨 ANOMALY: Pool ${pool.id} has ${pool.current_passengers} passengers (max capacity is 15)`);
      anomalies++;
    }
    if (pool.current_passengers !== pool._count.manifest_passengers) {
      console.log(`🚨 ANOMALY: Pool ${pool.id} current_passengers is ${pool.current_passengers} but manifest count is ${pool._count.manifest_passengers}`);
      anomalies++;
    }
  }

  // Verification checks
  if (totalDrivers !== 25) {
    console.log(`🚨 ERROR: Expected 25 drivers, found ${totalDrivers}`);
    anomalies++;
  }
  if (juanPoolsCount !== 30) {
    console.log(`🚨 ERROR: Expected Juan Lopez to have exactly 30 pools, found ${juanPoolsCount}`);
    anomalies++;
  }
  if (zeroPoolsActiveCount < 3) {
    console.log(`🚨 ERROR: Expected at least 3 active approved drivers with 0 pools, found ${zeroPoolsActiveCount}`);
    anomalies++;
  }

  if (anomalies === 0) {
    console.log('\n✅ Consistency checks passed! No anomalies found.');
  } else {
    console.log(`\n❌ Consistency checks failed with ${anomalies} anomalies.`);
  }
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
