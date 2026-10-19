// Formatação pt-BR centralizada (moeda, números, datas).

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const number3 = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 3,
});

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const dateOnly = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
});

export function formatBRL(value: number): string {
  return brl.format(value);
}

export function formatQuantity(value: number, unit?: string): string {
  const formatted = number3.format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatDateTime(value: string | Date): string {
  return dateTime.format(new Date(value));
}

export function formatDate(value: string | Date): string {
  return dateOnly.format(new Date(value));
}
