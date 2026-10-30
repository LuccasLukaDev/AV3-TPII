import { AdaptadorArmazenamento } from './adaptador.interfaces.js';
import { SistemaS3, SistemaGoogleCloud } from './sistemas-externos.js';

export class AdaptadorS3 implements AdaptadorArmazenamento {
  private sistema: SistemaS3;
  private bucket: string;

  constructor(sistema?: SistemaS3, bucket: string = 'cinebridge-media') {
    this.sistema = sistema ?? new SistemaS3();
    this.bucket = bucket;
  }

  async upload(arquivo: Buffer, caminho: string, metadados?: Record<string, string>): Promise<string> {
    const result = this.sistema.putObject(this.bucket, caminho, arquivo, metadados);
    return result.location;
  }

  async download(caminho: string): Promise<Buffer> {
    const data = this.sistema.getObject(this.bucket, caminho);
    if (!data) throw new Error(`Arquivo não encontrado no S3: ${caminho}`);
    return data;
  }

  async listar(prefixo: string): Promise<string[]> {
    return this.sistema.listObjects(this.bucket, prefixo);
  }

  async remover(caminho: string): Promise<boolean> {
    return this.sistema.deleteObject(this.bucket, caminho);
  }

  async obterUrl(caminho: string): Promise<string> {
    return this.sistema.getSignedUrl(this.bucket, caminho);
  }
}

export class AdaptadorGoogleCloud implements AdaptadorArmazenamento {
  private sistema: SistemaGoogleCloud;
  private bucket: string;

  constructor(sistema?: SistemaGoogleCloud, bucket: string = 'cinebridge-gcs') {
    this.sistema = sistema ?? new SistemaGoogleCloud();
    this.bucket = bucket;
  }

  async upload(arquivo: Buffer, caminho: string, metadados?: Record<string, string>): Promise<string> {
    const result = this.sistema.upload(this.bucket, caminho, arquivo, { metadata: metadados });
    return result.publicUrl;
  }

  async download(caminho: string): Promise<Buffer> {
    const data = this.sistema.download(this.bucket, caminho);
    if (!data) throw new Error(`Arquivo não encontrado no Google Cloud: ${caminho}`);
    return data;
  }

  async listar(prefixo: string): Promise<string[]> {
    return this.sistema.list(this.bucket, prefixo);
  }

  async remover(caminho: string): Promise<boolean> {
    return this.sistema.delete(this.bucket, caminho);
  }

  async obterUrl(caminho: string): Promise<string> {
    return this.sistema.getPublicUrl(this.bucket, caminho);
  }
}
