import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la precarga de datos (Seeding)...');

  // 1. LIMPIEZA TOTAL (Para poder correr el seed las veces que quieras sin duplicar)
  // El orden es estricto debido a las claves foráneas (FK)
  await prisma.operationalManifestSnapshotPassenger.deleteMany({});
  await prisma.pool.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.driver.deleteMany({});

  console.log('🗑️ Base de datos limpia.');

  // 2. CREACIÓN DE CONDUCTORES (Drivers)
  // Cumplimos con la consigna de tener choferes en diferentes estados de verificación
  const driverJuliana = await prisma.driver.create({
    data: {
      id: 'drv_juliana_01',
      clerk_user_id: 'user_3EZoK6pR0SB0EYHvCh3rpEcbNWT', // Tu ID de Clerk de las capturas
      full_name: 'Juliana Pagani (Chofer Verificado)',
      phone: '291-4567890',
      status: 'ACTIVE',
      verification_status: 'APPROVED', // Cuenta aprobada para el Marketplace
    },
  });

  const driverCarlos = await prisma.driver.create({
    data: {
      id: 'drv_carlos_02',
      clerk_user_id: 'user_clerk_driver_pendiente_999',
      full_name: 'Carlos Gómez (Chofer Pendiente)',
      phone: '291-1111111',
      status: 'ACTIVE',
      verification_status: 'PENDING', // En revisión por el admin
    },
  });

  const driverRechazado = await prisma.driver.create({
    data: {
      id: 'drv_rechazado_03',
      clerk_user_id: 'user_clerk_driver_rechazado_000',
      full_name: 'Esteban Quito (Rechazado)',
      phone: '291-9876543',
      status: 'INACTIVE',
      verification_status: 'REJECTED', // Rechazado por auditoría
    },
  });

  console.log('👤 Conductores creados.');

  // 3. CREACIÓN DE VEHÍCULOS (Vehicles)
  // Asociamos combis respetando el límite reglamentario de hasta 15 pasajeros
  const combiSprinter = await prisma.vehicle.create({
    data: {
      id: 'veh_sprinter_01',
      driver_id: driverJuliana.id,
      brand: 'Mercedes-Benz',
      model: 'Sprinter',
      license_plate: 'AF123JK',
      capacity: 15,
      status: 'ACTIVE',
    },
  });

  const combiMaster = await prisma.vehicle.create({
    data: {
      id: 'veh_master_02',
      driver_id: driverCarlos.id,
      brand: 'Renault',
      model: 'Master',
      license_plate: 'AE987UI',
      capacity: 12,
      status: 'ACTIVE',
    },
  });

  console.log('🚘 Vehículos registrados y asignados.');

  // 4. CREACIÓN DE POOLS (Viajes)
  // Alta densidad: Simulamos pools en múltiples estados para nutrir el Dashboard del Admin
  
  // Pool 1: Disponible en el Marketplace
  const poolMarket1 = await prisma.pool.create({
    data: {
      id: 'pool_available_01',
      destination_id: 'dest_polo_petroquimico', // Destino industrial de Bahía Blanca
      departure_time: new Date(new Date().getTime() + 3 * 60 * 60 * 1000), // En 3 horas
      status: 'AVAILABLE',
      current_passengers: 5, // Pasajeros simulados esperando chofer
      max_capacity: 15,
      driver_id: null,
      vehicle_id: null,
    },
  });

  // Pool 2: Otro disponible en el Marketplace
  await prisma.pool.create({
    data: {
      id: 'pool_available_02',
      destination_id: 'dest_puerto_white',
      departure_time: new Date(new Date().getTime() + 5 * 60 * 60 * 1000), // En 5 horas
      status: 'AVAILABLE',
      current_passengers: 9,
      max_capacity: 15,
      driver_id: null,
      vehicle_id: null,
    },
  });

  // Pool 3: Viaje ya asignado (Tomado por vos)
  await prisma.pool.create({
    data: {
      id: 'pool_assigned_03',
      destination_id: 'dest_parque_industrial',
      departure_time: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // En 24 horas
      status: 'AVAILABLE',
      current_passengers: 12,
      max_capacity: 15,
      driver_id: null,
      vehicle_id: null,
    },
  });

  // Pool 7: Viaje de Prueba con 8 pasajeros (Asignado a Juliana)
  await prisma.pool.create({
    data: {
      id: 'pool7',
      destination_id: 'dest_parque_industrial',
      departure_time: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // En 2 horas (fuera del rango de auto-lock inicial)
      status: 'AVAILABLE',
      current_passengers: 8,
      max_capacity: 15,
      driver_id: null,
      vehicle_id: null,
    },
  });

  // Pool 4: Viaje En Progreso (Sirve para ver tu ruta activa)
  const poolInProgress = await prisma.pool.create({
    data: {
      id: 'pool_progress_04',
      destination_id: 'dest_polo_petroquimico',
      departure_time: new Date('2026-06-12T07:00:00Z'),
      status: 'AVAILABLE',
      current_passengers: 2,
      max_capacity: 15,
      driver_id: null,
      vehicle_id: null,
      target_user_id: null,
      hito: null,
    },
  });

  // Pool 5: Viaje Completado con éxito (Para que la tasa de finalización del Admin no de 0%)
  await prisma.pool.create({
    data: {
      id: 'pool_completed_05',
      destination_id: 'dest_puerto_white',
      departure_time: new Date('2026-05-28T18:00:00Z'),
      status: 'COMPLETED',
      current_passengers: 14,
      max_capacity: 15,
      driver_id: driverJuliana.id,
      vehicle_id: combiSprinter.id,
    },
  });

  // Pool 6: Viaje Cancelado (Para nutrir los gráficos de la analítica)
  await prisma.pool.create({
    data: {
      id: 'pool_canceled_06',
      destination_id: 'dest_parque_industrial',
      departure_time: new Date('2026-05-29T10:00:00Z'),
      status: 'CANCELED',
      current_passengers: 0,
      max_capacity: 15,
      cancellation_reason: 'NO_DRIVER_ASSIGNED',
    },
  });

  console.log('🚌 Pools (Viajes) creados en todos los estados reglamentarios.');

  // 5. INYECCIÓN EN TU NUEVA TABLA (OperationalManifestSnapshotPassenger)
  const mockNamesList = [
    "Franco Gulino",
    "Juan Ignacio Ibarra",
    "Juliana Pagani",
    "Juan Bassi",
    "María Rodríguez",
    "Carlos Sánchez",
    "Ana Martínez",
    "José Gómez",
    "Laura Pérez",
    "Daniel Díaz",
    "Luis Torres",
    "Sofía Flores"
  ];

  const passengersToSeed = [];

  // Pasajeros para poolInProgress (2 pasajeros)
  passengersToSeed.push({
    pool_id: poolInProgress.id,
    reservation_id: 'res_externa_rider_101',
    passenger_user_id: 'usr_rider_simulado_01',
    passenger_name: 'Franco Gulino',
    pickup_address: 'Av. Alem 1250, Bahía Blanca',
    pickup_lat: -38.718,
    pickup_lng: -62.266,
    pickup_order: 1,
    passenger_status: 'PENDING'
  });
  passengersToSeed.push({
    pool_id: poolInProgress.id,
    reservation_id: 'res_externa_rider_102',
    passenger_user_id: 'usr_rider_simulado_02',
    passenger_name: 'Juan Ignacio Ibarra',
    pickup_address: 'Sarmiento 850, Bahía Blanca',
    pickup_lat: -38.713,
    pickup_lng: -62.261,
    pickup_order: 2,
    passenger_status: 'PENDING'
  });

  // Pasajeros para pool7 (8 pasajeros)
  for (let i = 0; i < 8; i++) {
    passengersToSeed.push({
      pool_id: 'pool7',
      reservation_id: `res_mock_pool7_${i + 1}`,
      passenger_user_id: `usr_mock_passenger_pool7_${i + 1}`,
      passenger_name: mockNamesList[i % mockNamesList.length],
      pickup_address: `Av. Alem ${1000 + (i * 100)}, Bahía Blanca`,
      pickup_lat: -38.718 + (i * 0.002),
      pickup_lng: -62.266 + (i * 0.002),
      pickup_order: i + 1,
      passenger_status: 'PENDING'
    });
  }

  // Pasajeros para pool_available_02 (9 pasajeros)
  for (let i = 0; i < 9; i++) {
    passengersToSeed.push({
      pool_id: 'pool_available_02',
      reservation_id: `res_mock_pool_available_02_${i + 1}`,
      passenger_user_id: `usr_mock_passenger_pool_available_02_${i + 1}`,
      passenger_name: mockNamesList[(i + 3) % mockNamesList.length],
      pickup_address: `Sarmiento ${800 + (i * 100)}, Bahía Blanca`,
      pickup_lat: -38.713 + (i * 0.002),
      pickup_lng: -62.261 + (i * 0.002),
      pickup_order: i + 1,
      passenger_status: 'PENDING'
    });
  }

  await prisma.operationalManifestSnapshotPassenger.createMany({
    data: passengersToSeed
  });

  console.log('📑 Copia local del Manifiesto de pasajeros inyectada en el pool activo.');
  console.log('🎉 ¡Proceso de Seeding finalizado con éxito total!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la ejecución del seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });