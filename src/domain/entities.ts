export type CaptureType =
  | 'documentario'
  | 'ficcao'
  | 'animacao'
  | 'publicitario';

export interface Competencia {
  nome: string;
  nivel: number;
}

export interface Avaliacao {
  projetoId: string;
  nota: number;
  comentario?: string;
}

export interface Profissional {
  id: string;
  nome: string;
  especialidades: string[];
  precoMedio: number;

  disponibilidade: {
    inicio: string;
    fim: string;
  }[];

  localizacao: string;

  vetorCompetencias: number[];

  competencias: Competencia[];

  historico: string[];

  avaliacoes: Avaliacao[];
}

export interface PapelObrigatorio {
  papel: string;
  peso: number;
}

export interface Projeto {
  id: string;
  genero: string;
  duracaoEstimada: number;
  orcamentoTotal: number;
  dataEntrega: string;
  tipoCaptacao: CaptureType;
  localizacao: string;
  papeis: PapelObrigatorio[];
  servicoPrincipal?: import('../composite/servico-projeto.js').ServicoProjeto;

  estrategia?:
    | 'cosine'
    | 'collaborative'
    | 'low-budget';
}

export type ConviteStatus =
  | 'produtor_aceitou'
  | 'rejeitado_produtor'
  | 'aceito'
  | 'rejeitado_profissional'
  | 'substituido';

export interface Convite {
  id: string;
  status: ConviteStatus;
  papel: string;
  projetoId: string;
  profissionalId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recomendacao {
  papel: string;
  profissional: Profissional;
  score: number;
  motivo: string;
}

export interface EquipeSugerida {
  projetoId: string;
  recomendacoes: Recomendacao[];
  scoreGeral: number;
  orcamentoEstimado: number;
}