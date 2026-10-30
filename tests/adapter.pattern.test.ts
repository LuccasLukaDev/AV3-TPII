import { describe, it, expect, beforeEach } from 'vitest';
import {
  AdaptadorS3,
  AdaptadorGoogleCloud
} from '../src/adapters/adaptador.armazenamento.js';
import {
  AdaptadorStripe,
  AdaptadorPagSeguro
} from '../src/adapters/adaptador.pagamento.js';
import {
  AdaptadorLinkedIn,
  AdaptadorInterno
} from '../src/adapters/adaptador.profissional.js';
import { SistemaS3, SistemaGoogleCloud, SistemaStripe, SistemaPagSeguro } from '../src/adapters/sistemas-externos.js';
import { RecommendationService } from '../src/services/recommendation.service.js';

describe('Adapter Pattern - Armazenamento', () => {
  it('AdaptadorS3 faz upload e download', async () => {
    const sistema = new SistemaS3();
    const adapter = new AdaptadorS3(sistema, 'test-bucket');
    const content = Buffer.from('roteiro de teste');
    const loc = await adapter.upload(content, 'projetos/p1/roteiro.txt');
    expect(loc).toContain('s3://');
    const downloaded = await adapter.download('projetos/p1/roteiro.txt');
    expect(downloaded.toString()).toBe('roteiro de teste');
    const list = await adapter.listar('projetos/');
    expect(list).toContain('projetos/p1/roteiro.txt');
  });

  it('AdaptadorGoogleCloud faz upload e download', async () => {
    const sistema = new SistemaGoogleCloud();
    const adapter = new AdaptadorGoogleCloud(sistema, 'gcs-bucket');
    const content = Buffer.from('storyboard');
    const loc = await adapter.upload(content, 'media/storyboard.png');
    expect(loc).toContain('storage.googleapis.com');
    const downloaded = await adapter.download('media/storyboard.png');
    expect(downloaded.toString()).toBe('storyboard');
  });

  it('SistemaRecomendacao troca adaptador de armazenamento sem alterar lógica', async () => {
    const service = new RecommendationService();
    const s3 = new AdaptadorS3(new SistemaS3());
    service.configurarAdaptadores({ armazenamento: s3 });
    const url1 = await service.uploadMidia(Buffer.from('a'), 'f1.txt');
    expect(url1).toContain('s3://');

    const gcs = new AdaptadorGoogleCloud(new SistemaGoogleCloud());
    service.configurarAdaptadores({ armazenamento: gcs });
    const url2 = await service.uploadMidia(Buffer.from('b'), 'f2.txt');
    expect(url2).toContain('storage.googleapis.com');
  });
});

describe('Adapter Pattern - Pagamento', () => {
  it('AdaptadorStripe processa pagamento e reembolso', async () => {
    const adapter = new AdaptadorStripe(new SistemaStripe());
    const result = await adapter.processarPagamento(150.5, 'BRL', 'Serviço edição');
    expect(result.id).toMatch(/^ch_/);
    expect(result.status).toBe('succeeded');
    expect(result.valor).toBe(150.5);
    const refund = await adapter.reembolsar(result.id);
    expect(refund.sucesso).toBe(true);
  });

  it('AdaptadorPagSeguro processa pagamento', async () => {
    const adapter = new AdaptadorPagSeguro(new SistemaPagSeguro());
    const result = await adapter.processarPagamento(200, 'BRL', 'Pós-produção');
    expect(result.id).toMatch(/^PS-/);
    expect(result.status).toBe('succeeded');
  });

  it('SistemaRecomendacao troca provedor de pagamento', async () => {
    const service = new RecommendationService();
    service.configurarAdaptadores({ pagamento: new AdaptadorStripe() });
    const r1 = await service.processarPagamento(100, 'BRL', 'teste');
    expect(r1.id).toMatch(/^ch_/);

    service.configurarAdaptadores({ pagamento: new AdaptadorPagSeguro() });
    const r2 = await service.processarPagamento(100, 'BRL', 'teste');
    expect(r2.id).toMatch(/^PS-/);
  });
});

describe('Adapter Pattern - Profissional', () => {
  it('AdaptadorLinkedIn busca profissionais', async () => {
    const adapter = new AdaptadorLinkedIn();
    const results = await adapter.buscarProfissionais({ especialidades: ['edicao'] });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].fonte).toBe('linkedin');
  });

  it('AdaptadorInterno busca profissionais', async () => {
    const adapter = new AdaptadorInterno();
    const results = await adapter.buscarProfissionais({ especialidades: ['vfx'] });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].fonte).toBe('interno');
  });

  it('SistemaRecomendacao troca fonte de profissionais', async () => {
    const service = new RecommendationService();
    service.configurarAdaptadores({ profissional: new AdaptadorLinkedIn() });
    const r1 = await service.buscarProfissionaisExternos({ especialidades: ['edicao'] });
    expect(r1.every(p => p.fonte === 'linkedin')).toBe(true);

    service.configurarAdaptadores({ profissional: new AdaptadorInterno() });
    const r2 = await service.buscarProfissionaisExternos({ especialidades: ['vfx'] });
    expect(r2.every(p => p.fonte === 'interno')).toBe(true);
  });
});
