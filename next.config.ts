import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build enxuto para Docker (gera .next/standalone com só o necessário).
  output: "standalone",
  // Há um package-lock.json perdido em C:\Users\Enzo que confunde o Next na
  // hora de inferir a raiz do projeto. Fixamos a raiz no diretório atual para
  // o rastreamento de arquivos ficar correto (relevante no build de produção).
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
