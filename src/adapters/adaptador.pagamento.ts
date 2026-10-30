import { AdaptadorPagamento } from './adaptador.interfaces.js';
import { SistemaStripe, SistemaPagSeguro } from './sistemas-externos.js';

export class AdaptadorStripe implements AdaptadorPagamento {
  private sistema: SistemaStripe;

  constructor(sistema?: SistemaStripe) {
    this.sistema = sistema ?? new SistemaStripe();
  }

  async processarPagamento(
    valor: number,
    moeda: string,
    descricao: string,
    _metadados?: Record<string, string>
  ): Promise<{ id: string; status: string; valor: number }> {
    const amountCents = Math.round(valor * 100);
    const result = this.sistema.createCharge(amountCents, moeda, descricao);
    return { id: result.id, status: result.status, valor };
  }

  async reembolsar(idTransacao: string, valor?: number): Promise<{ sucesso: boolean; id: string }> {
    const amountCents = valor !== undefined ? Math.round(valor * 100) : undefined;
    const result = this.sistema.createRefund(idTransacao, amountCents);
    return { sucesso: result.status === 'succeeded', id: result.id };
  }

  async consultarStatus(idTransacao: string): Promise<{ status: string; valor: number }> {
    const result = this.sistema.retrieveCharge(idTransacao);
    if (!result) throw new Error(`Transação Stripe não encontrada: ${idTransacao}`);
    return { status: result.status, valor: result.amount };
  }
}

export class AdaptadorPagSeguro implements AdaptadorPagamento {
  private sistema: SistemaPagSeguro;

  constructor(sistema?: SistemaPagSeguro) {
    this.sistema = sistema ?? new SistemaPagSeguro();
  }

  async processarPagamento(
    valor: number,
    moeda: string,
    descricao: string,
    _metadados?: Record<string, string>
  ): Promise<{ id: string; status: string; valor: number }> {
    const result = this.sistema.criarCobranca(valor, descricao);
    return { id: result.codigo, status: result.status === 'PAGA' ? 'succeeded' : result.status, valor };
  }

  async reembolsar(idTransacao: string, valor?: number): Promise<{ sucesso: boolean; id: string }> {
    const result = this.sistema.estornar(idTransacao, valor);
    return { sucesso: result.status === 'ESTORNADO', id: result.codigoEstorno };
  }

  async consultarStatus(idTransacao: string): Promise<{ status: string; valor: number }> {
    const result = this.sistema.consultar(idTransacao);
    if (!result) throw new Error(`Transação PagSeguro não encontrada: ${idTransacao}`);
    return { status: result.status === 'PAGA' ? 'succeeded' : result.status, valor: result.valor };
  }
}
