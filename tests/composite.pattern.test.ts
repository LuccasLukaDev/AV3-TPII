import { describe, it, expect } from 'vitest';
import { ServicoAtomico, PacoteServico, ServicoProjeto } from '../src/composite/servico-projeto.js';
import { Projeto } from '../src/domain/entities.js';
import { RecommendationService } from '../src/services/recommendation.service.js';

describe('Composite Pattern - ServicoProjeto', () => {
  it('ServicoAtomico calcula custo, prazo e valida', () => {
    const edicao = new ServicoAtomico('Edição de vídeo', 2500, 10, 'editor');
    expect(edicao.calcularCusto()).toBe(2500);
    expect(edicao.obterPrazo()).toBe(10);
    expect(edicao.validar()).toBe(true);
    expect(edicao.listarSubservicos()).toEqual([]);
    expect(edicao.obterPapel()).toBe('editor');
  });

  it('PacoteServico agrega custos e prazos recursivamente', () => {
    const edicao = new ServicoAtomico('Edição', 2000, 7, 'editor');
    const color = new ServicoAtomico('Coloração', 1500, 5, 'colorista');
    const mix = new ServicoAtomico('Mixagem', 1200, 4, 'mixer');

    const posProducao = new PacoteServico('Pós-produção');
    posProducao.adicionar(edicao);
    posProducao.adicionar(color);
    posProducao.adicionar(mix);

    expect(posProducao.calcularCusto()).toBe(4700);
    expect(posProducao.obterPrazo()).toBe(7);
    expect(posProducao.validar()).toBe(true);
    expect(posProducao.listarSubservicos().length).toBe(3);
  });

  it('Hierarquia aninhada de pacotes', () => {
    const corte = new ServicoAtomico('Corte bruto', 800, 3, 'editor');
    const fineCut = new ServicoAtomico('Fine cut', 1200, 4, 'editor');
    const edicao = new PacoteServico('Edição');
    edicao.adicionar(corte);
    edicao.adicionar(fineCut);

    const color = new ServicoAtomico('Color grading', 1800, 6, 'colorista');
    const vfx = new ServicoAtomico('VFX simples', 3000, 12, 'vfx');

    const pos = new PacoteServico('Pós-produção completa');
    pos.adicionar(edicao);
    pos.adicionar(color);
    pos.adicionar(vfx);

    expect(pos.calcularCusto()).toBe(800 + 1200 + 1800 + 3000);
    expect(pos.obterPrazo()).toBe(12);
    expect(pos.validar()).toBe(true);

    const sub = pos.listarSubservicos();
    expect(sub.length).toBe(3);
    const edicaoNode = sub.find(s => s.obterNome() === 'Edição') as PacoteServico;
    expect(edicaoNode.listarSubservicos().length).toBe(2);
  });

  it('Validação falha com serviço inválido', () => {
    const invalido = new ServicoAtomico('X', 0, 0, '');
    expect(invalido.validar()).toBe(false);
    const pacote = new PacoteServico('P');
    pacote.adicionar(invalido);
    expect(pacote.validar()).toBe(false);
  });

  it('Projeto com servicoPrincipal delega cálculo de custo e prazo', () => {
    const atom = new ServicoAtomico('Câmera', 1000, 5, 'camera');
    const pacote = new PacoteServico('Produção');
    pacote.adicionar(atom);
    pacote.adicionar(new ServicoAtomico('Som', 600, 3, 'sound'));

    const projeto: Projeto = {
      id: 'p-comp-1',
      genero: 'ficcao',
      duracaoEstimada: 20,
      orcamentoTotal: 50000,
      dataEntrega: '2026-12-01',
      tipoCaptacao: 'ficcao',
      localizacao: 'São Paulo',
      papeis: [{ papel: 'camera', peso: 1 }],
      servicoPrincipal: pacote
    };

    const service = new RecommendationService();
    expect(service.calcularCustoTotalProjeto(projeto)).toBe(1600);
    expect(service.obterPrazoProjeto(projeto)).toBe(5);
    expect(service.validarServicosProjeto(projeto)).toBe(true);
  });
});
