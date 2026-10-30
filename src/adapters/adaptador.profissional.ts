import { AdaptadorProfissional } from './adaptador.interfaces.js';
import { SistemaLinkedIn, SistemaCadastroInterno } from './sistemas-externos.js';

export class AdaptadorLinkedIn implements AdaptadorProfissional {
  private sistema: SistemaLinkedIn;

  constructor(sistema?: SistemaLinkedIn) {
    this.sistema = sistema ?? new SistemaLinkedIn();
  }

  async buscarProfissionais(filtros: {
    especialidades?: string[];
    localizacao?: string;
    precoMaximo?: number;
  }): Promise<Array<{ id: string; nome: string; especialidades: string[]; precoMedio: number; fonte: string }>> {
    const results = this.sistema.searchPeople({
      skills: filtros.especialidades,
      location: filtros.localizacao,
      maxRate: filtros.precoMaximo
    });
    return results.map(r => ({
      id: r.id,
      nome: r.name,
      especialidades: r.skills,
      precoMedio: r.rate,
      fonte: 'linkedin'
    }));
  }

  async obterPerfil(id: string): Promise<{ id: string; nome: string; especialidades: string[]; precoMedio: number; fonte: string } | null> {
    const p = this.sistema.getProfile(id);
    if (!p) return null;
    return {
      id: p.id,
      nome: p.name,
      especialidades: p.skills,
      precoMedio: p.rate,
      fonte: 'linkedin'
    };
  }

  async sincronizar(_idExterno: string): Promise<boolean> {
    return true;
  }
}

export class AdaptadorInterno implements AdaptadorProfissional {
  private sistema: SistemaCadastroInterno;

  constructor(sistema?: SistemaCadastroInterno) {
    this.sistema = sistema ?? new SistemaCadastroInterno();
  }

  async buscarProfissionais(filtros: {
    especialidades?: string[];
    localizacao?: string;
    precoMaximo?: number;
  }): Promise<Array<{ id: string; nome: string; especialidades: string[]; precoMedio: number; fonte: string }>> {
    const results = this.sistema.listar(filtros);
    return results.map(r => ({
      id: r.id,
      nome: r.nome,
      especialidades: r.especialidades,
      precoMedio: r.precoMedio,
      fonte: 'interno'
    }));
  }

  async obterPerfil(id: string): Promise<{ id: string; nome: string; especialidades: string[]; precoMedio: number; fonte: string } | null> {
    const p = this.sistema.obter(id);
    if (!p) return null;
    return {
      id: p.id,
      nome: p.nome,
      especialidades: p.especialidades,
      precoMedio: p.precoMedio,
      fonte: 'interno'
    };
  }

  async sincronizar(idExterno: string): Promise<boolean> {
    return this.sistema.sincronizarExterno(idExterno);
  }
}
