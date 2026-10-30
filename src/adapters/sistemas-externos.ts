export class SistemaS3 {
  private storage: Map<string, Buffer> = new Map();

  putObject(bucket: string, key: string, body: Buffer, meta?: Record<string, string>): { etag: string; location: string } {
    const fullKey = `${bucket}/${key}`;
    this.storage.set(fullKey, body);
    return { etag: `etag-${Date.now()}`, location: `s3://${fullKey}` };
  }

  getObject(bucket: string, key: string): Buffer | null {
    return this.storage.get(`${bucket}/${key}`) ?? null;
  }

  listObjects(bucket: string, prefix: string): string[] {
    const results: string[] = [];
    const fullPrefix = `${bucket}/${prefix}`;
    for (const key of this.storage.keys()) {
      if (key.startsWith(fullPrefix)) {
        results.push(key.replace(`${bucket}/`, ''));
      }
    }
    return results;
  }

  deleteObject(bucket: string, key: string): boolean {
    return this.storage.delete(`${bucket}/${key}`);
  }

  getSignedUrl(bucket: string, key: string): string {
    return `https://s3.amazonaws.com/${bucket}/${key}?signed=true`;
  }
}

export class SistemaGoogleCloud {
  private blobs: Map<string, Buffer> = new Map();

  upload(bucketName: string, fileName: string, data: Buffer, options?: { metadata?: Record<string, string> }): { publicUrl: string } {
    const path = `${bucketName}/${fileName}`;
    this.blobs.set(path, data);
    return { publicUrl: `https://storage.googleapis.com/${path}` };
  }

  download(bucketName: string, fileName: string): Buffer | null {
    return this.blobs.get(`${bucketName}/${fileName}`) ?? null;
  }

  list(bucketName: string, prefix: string): string[] {
    const results: string[] = [];
    for (const key of this.blobs.keys()) {
      if (key.startsWith(`${bucketName}/${prefix}`)) {
        results.push(key.replace(`${bucketName}/`, ''));
      }
    }
    return results;
  }

  delete(bucketName: string, fileName: string): boolean {
    return this.blobs.delete(`${bucketName}/${fileName}`);
  }

  getPublicUrl(bucketName: string, fileName: string): string {
    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
  }
}

export class SistemaStripe {
  private transactions: Map<string, { amount: number; currency: string; status: string; description: string }> = new Map();

  createCharge(amountCents: number, currency: string, description: string): { id: string; status: string } {
    const id = `ch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.transactions.set(id, {
      amount: amountCents / 100,
      currency,
      status: 'succeeded',
      description
    });
    return { id, status: 'succeeded' };
  }

  createRefund(chargeId: string, amountCents?: number): { id: string; status: string } {
    const tx = this.transactions.get(chargeId);
    if (!tx) throw new Error('Charge not found');
    const id = `re_${Date.now()}`;
    return { id, status: 'succeeded' };
  }

  retrieveCharge(chargeId: string): { id: string; amount: number; currency: string; status: string } | null {
    const tx = this.transactions.get(chargeId);
    if (!tx) return null;
    return { id: chargeId, amount: tx.amount, currency: tx.currency, status: tx.status };
  }
}

export class SistemaPagSeguro {
  private orders: Map<string, { valor: number; status: string; descricao: string }> = new Map();

  criarCobranca(valor: number, descricao: string): { codigo: string; status: string } {
    const codigo = `PS-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    this.orders.set(codigo, { valor, status: 'PAGA', descricao });
    return { codigo, status: 'PAGA' };
  }

  estornar(codigo: string, valor?: number): { codigoEstorno: string; status: string } {
    if (!this.orders.has(codigo)) throw new Error('Pedido não encontrado');
    return { codigoEstorno: `EST-${Date.now()}`, status: 'ESTORNADO' };
  }

  consultar(codigo: string): { codigo: string; valor: number; status: string } | null {
    const order = this.orders.get(codigo);
    if (!order) return null;
    return { codigo, valor: order.valor, status: order.status };
  }
}

export class SistemaLinkedIn {
  private profiles: Map<string, { id: string; nome: string; skills: string[]; rate: number }> = new Map([
    ['li-001', { id: 'li-001', nome: 'Ana Silva LinkedIn', skills: ['edicao', 'coloracao'], rate: 350 }],
    ['li-002', { id: 'li-002', nome: 'Carlos Mendes LinkedIn', skills: ['mixagem', 'som'], rate: 280 }],
    ['li-003', { id: 'li-003', nome: 'Beatriz Costa LinkedIn', skills: ['direcao', 'roteiro'], rate: 500 }]
  ]);

  searchPeople(filters: { skills?: string[]; location?: string; maxRate?: number }): Array<{ id: string; name: string; skills: string[]; rate: number }> {
    let results = Array.from(this.profiles.values());
    if (filters.skills && filters.skills.length > 0) {
      results = results.filter(p => filters.skills!.some(s => p.skills.includes(s)));
    }
    if (filters.maxRate !== undefined) {
      results = results.filter(p => p.rate <= filters.maxRate!);
    }
    return results.map(p => ({ id: p.id, name: p.nome, skills: p.skills, rate: p.rate }));
  }

  getProfile(id: string): { id: string; name: string; skills: string[]; rate: number } | null {
    const p = this.profiles.get(id);
    if (!p) return null;
    return { id: p.id, name: p.nome, skills: p.skills, rate: p.rate };
  }
}

export class SistemaCadastroInterno {
  private profissionais: Map<string, { id: string; nome: string; especialidades: string[]; precoMedio: number }> = new Map([
    ['int-001', { id: 'int-001', nome: 'Diego Rocha Interno', especialidades: ['vfx', 'animacao'], precoMedio: 420 }],
    ['int-002', { id: 'int-002', nome: 'Fernanda Lima Interno', especialidades: ['edicao', 'montagem'], precoMedio: 310 }],
    ['int-003', { id: 'int-003', nome: 'Gustavo Alves Interno', especialidades: ['camera', 'iluminacao'], precoMedio: 380 }]
  ]);

  listar(filtros: { especialidades?: string[]; localizacao?: string; precoMaximo?: number }): Array<{ id: string; nome: string; especialidades: string[]; precoMedio: number }> {
    let results = Array.from(this.profissionais.values());
    if (filtros.especialidades && filtros.especialidades.length > 0) {
      results = results.filter(p => filtros.especialidades!.some(e => p.especialidades.includes(e)));
    }
    if (filtros.precoMaximo !== undefined) {
      results = results.filter(p => p.precoMedio <= filtros.precoMaximo!);
    }
    return results;
  }

  obter(id: string): { id: string; nome: string; especialidades: string[]; precoMedio: number } | null {
    return this.profissionais.get(id) ?? null;
  }

  sincronizarExterno(id: string): boolean {
    return this.profissionais.has(id) || id.startsWith('int-');
  }
}
