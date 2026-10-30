export interface ServicoProjeto {
  calcularCusto(): number;
  listarSubservicos(): ServicoProjeto[];
  obterPrazo(): number;
  validar(): boolean;
  obterNome(): string;
  obterPapel(): string | null;
}

export class ServicoAtomico implements ServicoProjeto {
  private nome: string;
  private custo: number;
  private prazoDias: number;
  private papel: string;

  constructor(nome: string, custo: number, prazoDias: number, papel: string) {
    this.nome = nome;
    this.custo = custo;
    this.prazoDias = prazoDias;
    this.papel = papel;
  }

  calcularCusto(): number {
    return this.custo;
  }

  listarSubservicos(): ServicoProjeto[] {
    return [];
  }

  obterPrazo(): number {
    return this.prazoDias;
  }

  validar(): boolean {
    return this.custo > 0 && this.prazoDias > 0 && this.papel.trim().length > 0;
  }

  obterNome(): string {
    return this.nome;
  }

  obterPapel(): string | null {
    return this.papel;
  }
}

export class PacoteServico implements ServicoProjeto {
  private nome: string;
  private filhos: ServicoProjeto[] = [];

  constructor(nome: string) {
    this.nome = nome;
  }

  adicionar(servico: ServicoProjeto): void {
    this.filhos.push(servico);
  }

  remover(servico: ServicoProjeto): void {
    const idx = this.filhos.indexOf(servico);
    if (idx >= 0) {
      this.filhos.splice(idx, 1);
    }
  }

  calcularCusto(): number {
    return this.filhos.reduce((total, s) => total + s.calcularCusto(), 0);
  }

  listarSubservicos(): ServicoProjeto[] {
    return [...this.filhos];
  }

  obterPrazo(): number {
    if (this.filhos.length === 0) return 0;
    return Math.max(...this.filhos.map(s => s.obterPrazo()));
  }

  validar(): boolean {
    if (this.filhos.length === 0) return false;
    return this.filhos.every(s => s.validar());
  }

  obterNome(): string {
    return this.nome;
  }

  obterPapel(): string | null {
    return null;
  }
}
