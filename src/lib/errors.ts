// Erro de regra de negócio (ex.: estoque insuficiente). Diferencia falhas
// esperadas/tratáveis de erros inesperados — as actions convertem em mensagem.
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
