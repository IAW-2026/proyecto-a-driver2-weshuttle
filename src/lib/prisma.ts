import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // En Prisma 7, la conexión se configura directamente en el constructor del cliente.
  // Si usas Prisma Accelerate o "prisma+postgres://", usa accelerateUrl.
  return new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL, // O usa "adapter: ..." si tienes un driver nativo
  } as any);
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = global.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') global.prismaGlobal = prisma;