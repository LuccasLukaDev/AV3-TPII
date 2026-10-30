export interface AdaptadorArmazenamento {
  upload(arquivo: Buffer, caminho: string, metadados?: Record<string, string>): Promise<string>;
  download(caminho: string): Promise<Buffer>;
  listar(prefixo: string): Promise<string[]>;
  remover(caminho: string): Promise<boolean>;
  obterUrl(caminho: string): Promise<string>;
}

export interface AdaptadorPagamento {
  processarPagamento(
    valor: number,
    moeda: string,
    descricao: string,
    metadados?: Record<string, string>
  ): Promise<{ id: string; status: string; valor: number }>;
  reembolsar(idTransacao: string, valor?: number): Promise<{ sucesso: boolean; id: string }>;
  consultarStatus(idTransacao: string): Promise<{ status: string; valor: number }>;
}

export interface AdaptadorProfissional {
  buscarProfissionais(filtros: {
    especialidades?: string[];
    localizacao?: string;
    precoMaximo?: number;
  }): Promise<Array<{ id: string; nome: string; especialidades: string[]; precoMedio: number; fonte: string }>>;
  obterPerfil(id: string): Promise<{ id: string; nome: string; especialidades: string[]; precoMedio: number; fonte: string } | null>;
  sincronizar(idExterno: string): Promise<boolean>;
}
