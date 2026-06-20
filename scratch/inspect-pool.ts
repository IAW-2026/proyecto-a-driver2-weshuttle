import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const poolId = "cmqlpot200005lb04nimnpqv5";
  console.log(`Checking database state for pool: ${poolId}...`);

  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    include: {
      manifest_passengers: true
    }
  });

  if (!pool) {
    console.log(`Pool ${poolId} not found in database!`);
    return;
  }

  console.log("POOL DATA:");
  console.log({
    id: pool.id,
    status: pool.status,
    destination_id: pool.destination_id,
    current_passengers: pool.current_passengers,
    target_user_id: pool.target_user_id,
    hito: pool.hito,
  });

  console.log("\nMANIFEST PASSENGERS:");
  if (pool.manifest_passengers.length === 0) {
    console.log("No manifest passengers found.");
  } else {
    pool.manifest_passengers.forEach((p, idx) => {
      console.log(`[Passenger ${idx + 1}]`);
      console.log({
        id: p.id,
        reservation_id: p.reservation_id,
        passenger_name: p.passenger_name,
        passenger_user_id: p.passenger_user_id,
        pickup_address: p.pickup_address,
        pickup_lat: p.pickup_lat,
        pickup_lng: p.pickup_lng,
        passenger_status: p.passenger_status,
      });
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
