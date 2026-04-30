import type { ReactNode } from 'react';
import type { IMensaje } from './IMensaje';
import { MensajeDecorador } from './MensajeDecorador';

type MimeCategoria = 'image' | 'pdf' | 'excel' | 'generic';

function getMimeCategoria(mimeType: string): MimeCategoria {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType === 'text/csv'
  )
    return 'excel';
  return 'generic';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const LABEL: Record<MimeCategoria, string> = {
  image: 'Imagen',
  pdf: 'PDF',
  excel: 'Excel',
  generic: 'Archivo',
};

export class MensajeConArchivo extends MensajeDecorador {
  constructor(
    mensaje: IMensaje,
    private readonly url: string,
    private readonly mimeType: string,
    private readonly tamano: number,
    private readonly nombreArchivo: string,
  ) {
    super(mensaje);
  }

  override render(): ReactNode {
    const categoria = getMimeCategoria(this.mimeType);

    return (
      <div data-testid="mensaje-con-archivo">
        {this.wrapped.render()}
        <div className="ml-12 mt-2" data-testid="archivo-bloque">
          {categoria === 'image' ? (
            <a
              href={this.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-fit overflow-hidden rounded-lg border border-ink-100 transition hover:opacity-90"
              data-testid="archivo-imagen"
            >
              <img
                src={this.url}
                alt={this.nombreArchivo}
                className="h-40 max-w-xs object-cover"
              />
            </a>
          ) : (
            <a
              href={this.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 transition hover:bg-ink-100"
              data-testid="archivo-chip"
            >
              <div className="text-left">
                <p className="max-w-[200px] truncate text-sm font-medium text-ink-900">
                  {this.nombreArchivo}
                </p>
                <p className="text-xs text-ink-400" data-testid="archivo-meta">
                  {LABEL[categoria]} · {formatBytes(this.tamano)}
                </p>
              </div>
            </a>
          )}
        </div>
      </div>
    );
  }
}
