import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const pools = await prisma.pool.findMany({
    include: {
      manifest_passengers: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  console.log("=== ALL POOLS ===");
  for (const pool of pools) {
    console.log(`Pool ID: ${pool.id}, Status: ${pool.status}, Current Passengers: ${pool.current_passengers}, Manifest Count: ${pool.manifest_passengers.length}, Destination: ${pool.destination_id}, Created At: ${pool.createdAt.toISOString()}`);
    for (const p of pool.manifest_passengers) {
      console.log(`  -> Res ID: ${p.reservation_id}, User ID: ${p.passenger_user_id}, Name: ${p.passenger_name}`);
    }
  }

  const passengers = await prisma.operationalManifestSnapshotPassenger.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  console.log("\n=== ALL PASSENGERS IN DATABASE ===");
  for (const p of passengers) {
    console.log(`Pool ID: ${p.pool_id}, Reservation ID: ${p.reservation_id}, User ID: ${p.passenger_user_id}, Name: ${p.passenger_name}, Created At: ${p.createdAt.toISOString()}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

