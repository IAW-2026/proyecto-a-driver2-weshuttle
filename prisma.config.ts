import { defineConfig } from "prisma/config";
import { loadEnvConfig } from "@next/env";
import * as fs from "fs";
import * as path from "path";

loadEnvConfig(process.cwd());

// Cargador "a la fuerza": Si el loader falla, leemos el archivo nativamente
if (!process.env.DATABASE_URL) {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const dbUrlLine = envContent.split("\n").find(line => line.startsWith("DATABASE_URL="));
    if (dbUrlLine) {
      // Extraemos el valor y le quitamos las comillas dobles si las tiene
      process.env.DATABASE_URL = dbUrlLine.substring(dbUrlLine.indexOf("=") + 1).replace(/^"|"$/g, "").trim();
    }
  }
}

console.log("ESTADO DATABASE_URL:", process.env.DATABASE_URL ? "¡Encontrada!" : "Aún vacía");

type Config = ReturnType<typeof defineConfig>;

const config: Config = defineConfig({
  migrations: {
    path: "prisma/migrations",
  },
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
});

export default config;
