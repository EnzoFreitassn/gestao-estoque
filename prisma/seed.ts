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
      name: "Marina Bianchi",
      email: "dono@massas.com",
      password: ownerHash,
      role: Role.OWNER,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "funcionario@massas.com" },
    update: {},
    create: {
      name: "Carlos Nunes",
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
  // Estratégia: o "estoque inicial" de cada produto é distribuído em dias
  // diferentes dos últimos 14 dias (evita o pico único no gráfico), e a
  // atividade recente usa pares entrada/saída de mesma quantidade (saldo zero
  // por produto, para não divergir das quantidades definidas acima).
  const movementCount = await prisma.stockMovement.count();
  if (movementCount === 0) {
    const daysAgo = (n: number, hour = 10) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      d.setHours(hour, 0, 0, 0);
      return d;
    };

    const all = await prisma.product.findMany({
      select: { id: true, sku: true, quantity: true },
    });

    const inReasons = [
      "Compra de reposição",
      "Produção finalizada",
      "Devolução de cliente",
    ];
    const outReasons = ["Venda", "Consumo em produção", "Ajuste de inventário"];

    // Estoque inicial espalhado: 1 produto por dia, de ~13 a ~2 dias atrás.
    for (let i = 0; i < all.length; i += 1) {
      const p = all[i];
      if (p.quantity.lessThanOrEqualTo(0)) continue;
      const day = Math.max(1, 13 - i);
      await prisma.stockMovement.create({
        data: {
          productId: p.id,
          type: "IN",
          quantity: p.quantity,
          reason: "Estoque inicial",
          userId: owner.id,
          createdAt: daysAgo(day, 8),
        },
      });
    }

    // Atividade variada (quantidades e dias distintos), saldo zero por produto.
    const activity = [
      { sku: "INS-FAR-SEM", q: 40, inDay: 12, outDay: 6 },
      { sku: "MAS-ESP-500", q: 30, inDay: 11, outDay: 9 },
      { sku: "MAS-PEN-500", q: 12, inDay: 10, outDay: 4 },
      { sku: "MAS-TAL-500", q: 10, inDay: 9, outDay: 2 },
      { sku: "MOL-TOM-340", q: 18, inDay: 8, outDay: 7 },
      { sku: "MAS-LAS-500", q: 15, inDay: 7, outDay: 1 },
      { sku: "ACO-QJO-100", q: 8, inDay: 6, outDay: 5 },
      { sku: "MAS-NHO-1000", q: 6, inDay: 5, outDay: 3 },
      { sku: "MAS-RAV-RIC", q: 9, inDay: 4, outDay: 0 },
      { sku: "MOL-PES-180", q: 7, inDay: 3, outDay: 2 },
      { sku: "MAS-CAP-FRA", q: 5, inDay: 2, outDay: 0 },
    ];

    for (let i = 0; i < activity.length; i += 1) {
      const a = activity[i];
      const product = all.find((p) => p.sku === a.sku);
      if (!product) continue;
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "IN",
          quantity: a.q,
          reason: inReasons[i % inReasons.length],
          userId: owner.id,
          createdAt: daysAgo(a.inDay, 11),
        },
      });
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "OUT",
          quantity: a.q,
          reason: outReasons[i % outReasons.length],
          userId: employee.id,
          createdAt: daysAgo(a.outDay, 15),
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
