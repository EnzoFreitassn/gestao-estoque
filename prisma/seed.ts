import { PrismaClient, Role, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Produtos realistas de uma fábrica de massas (dados de exemplo).
const products: Prisma.ProductCreateInput[] = [
  {
    name: "Espaguete Grano Duro 500g",
    sku: "MAS-ESP-500",
    description: "Massa seca de sêmola de trigo grano duro.",
    category: "Massas secas",
    unit: "pacote",
    costPrice: "3.20",
    salePrice: "6.90",
    quantity: "180",
    minQuantity: "40",
  },
  {
    name: "Penne Grano Duro 500g",
    sku: "MAS-PEN-500",
    description: "Massa curta tipo penne rigate.",
    category: "Massas secas",
    unit: "pacote",
    costPrice: "3.20",
    salePrice: "6.90",
    quantity: "25",
    minQuantity: "40",
  },
  {
    name: "Talharim Caseiro 500g",
    sku: "MAS-TAL-500",
    description: "Massa fresca laminada, validade curta.",
    category: "Massas frescas",
    unit: "pacote",
    costPrice: "5.10",
    salePrice: "11.50",
    quantity: "60",
    minQuantity: "20",
  },
  {
    name: "Nhoque de Batata 1kg",
    sku: "MAS-NHO-1000",
    description: "Nhoque fresco de batata.",
    category: "Massas frescas",
    unit: "pacote",
    costPrice: "7.80",
    salePrice: "16.90",
    quantity: "32",
    minQuantity: "15",
  },
  {
    name: "Ravioli de Ricota e Espinafre 500g",
    sku: "MAS-RAV-RIC",
    description: "Massa recheada fresca.",
    category: "Massas recheadas",
    unit: "pacote",
    costPrice: "9.40",
    salePrice: "21.00",
    quantity: "18",
    minQuantity: "12",
  },
  {
    name: "Capeletti de Frango 500g",
    sku: "MAS-CAP-FRA",
    description: "Massa recheada fresca de frango.",
    category: "Massas recheadas",
    unit: "pacote",
    costPrice: "9.90",
    salePrice: "22.50",
    quantity: "10",
    minQuantity: "12",
  },
  {
    name: "Lasanha Pré-cozida 500g",
    sku: "MAS-LAS-500",
    description: "Placas de lasanha pré-cozidas.",
    category: "Massas secas",
    unit: "pacote",
    costPrice: "4.60",
    salePrice: "9.90",
    quantity: "75",
    minQuantity: "30",
  },
  {
    name: "Farinha de Sêmola",
    sku: "INS-FAR-SEM",
    description: "Insumo base para produção de massas.",
    category: "Insumos",
    unit: "kg",
    costPrice: "4.10",
    salePrice: "0.00",
    quantity: "320.5",
    minQuantity: "100",
  },
  {
    name: "Ovos (dúzia)",
    sku: "INS-OVO-DZ",
    description: "Insumo para massas frescas.",
    category: "Insumos",
    unit: "caixa",
    costPrice: "9.00",
    salePrice: "0.00",
    quantity: "22",
    minQuantity: "10",
  },
  {
    name: "Molho de Tomate Artesanal 340g",
    sku: "MOL-TOM-340",
    description: "Molho pronto artesanal.",
    category: "Molhos",
    unit: "un",
    costPrice: "4.80",
    salePrice: "12.00",
    quantity: "48",
    minQuantity: "24",
  },
  {
    name: "Molho Pesto 180g",
    sku: "MOL-PES-180",
    description: "Molho pesto de manjericão.",
    category: "Molhos",
    unit: "un",
    costPrice: "6.50",
    salePrice: "16.00",
    quantity: "8",
    minQuantity: "12",
  },
  {
    name: "Queijo Ralado 100g",
    sku: "ACO-QJO-100",
    description: "Acompanhamento parmesão ralado.",
    category: "Acompanhamentos",
    unit: "pacote",
    costPrice: "5.20",
    salePrice: "11.90",
    quantity: "40",
    minQuantity: "15",
  },
];

// Fase 0: usuários de teste (1 OWNER + 1 EMPLOYEE).
// Fase 1: produtos de exemplo de uma fábrica de massas.
async function main() {
  const [ownerHash, employeeHash] = await Promise.all([
    bcrypt.hash("owner123", 10),
    bcrypt.hash("employee123", 10),
  ]);

  const owner = await prisma.user.upsert({
    where: { email: "dono@massas.com" },
    update: {},
    create: {
      name: "Dona das Massas",
      email: "dono@massas.com",
      password: ownerHash,
      role: Role.OWNER,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "funcionario@massas.com" },
    update: {},
    create: {
      name: "Funcionário Teste",
      email: "funcionario@massas.com",
      password: employeeHash,
      role: Role.EMPLOYEE,
    },
  });

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  // Histórico de movimentações de exemplo (apenas na primeira carga).
  // "Estoque inicial" (IN = quantidade atual) + atividade recente NET-ZERO,
  // para não divergir das quantidades definidas acima.
  const movementCount = await prisma.stockMovement.count();
  if (movementCount === 0) {
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      d.setHours(10, 0, 0, 0);
      return d;
    };

    const all = await prisma.product.findMany({
      select: { id: true, sku: true, quantity: true },
    });

    for (const p of all) {
      if (p.quantity.greaterThan(0)) {
        await prisma.stockMovement.create({
          data: {
            productId: p.id,
            type: "IN",
            quantity: p.quantity,
            reason: "Estoque inicial",
            userId: owner.id,
            createdAt: daysAgo(12),
          },
        });
      }
    }

    // Pares entrada/saída de mesma quantidade (saldo zero) em dias recentes.
    const activity = [
      { sku: "MAS-ESP-500", q: 20, day: 6 },
      { sku: "MAS-PEN-500", q: 15, day: 5 },
      { sku: "MOL-TOM-340", q: 12, day: 4 },
      { sku: "MAS-TAL-500", q: 10, day: 3 },
      { sku: "ACO-QJO-100", q: 8, day: 2 },
      { sku: "MAS-LAS-500", q: 10, day: 1 },
    ];

    for (const a of activity) {
      const product = all.find((p) => p.sku === a.sku);
      if (!product) continue;
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "IN",
          quantity: a.q,
          reason: "Compra de reposição",
          userId: owner.id,
          createdAt: daysAgo(a.day),
        },
      });
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "OUT",
          quantity: a.q,
          reason: "Venda",
          userId: employee.id,
          createdAt: daysAgo(Math.max(a.day - 1, 0)),
        },
      });
    }
  }

  console.log("Seed concluído:");
  console.log(`  OWNER    -> ${owner.email} / owner123`);
  console.log(`  EMPLOYEE -> ${employee.email} / employee123`);
  console.log(`  Produtos -> ${products.length} itens`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
