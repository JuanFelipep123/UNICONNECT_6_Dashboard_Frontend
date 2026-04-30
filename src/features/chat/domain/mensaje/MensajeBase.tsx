import type { ReactNode } from 'react';
import type { IMensaje } from './IMensaje';

export class MensajeBase implements IMensaje {
  constructor(
    private readonly contenido: string,
    private readonly userId: string,
    private readonly timestamp: Date,
    private readonly metadata: Record<string, unknown> = {},
  ) {}

  getContenido(): string {
    return this.contenido;
  }

  getMetadata(): Record<string, unknown> {
    return { userId: this.userId, timestamp: this.timestamp, ...this.metadata };
  }

  render(): ReactNode {
    const initial = this.userId.charAt(0).toUpperCase();
    const time = this.timestamp.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div className="flex gap-3" data-testid="mensaje-base">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-900">
          {initial}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-ink-500" data-testid="mensaje-userid">
              {this.userId}
            </span>
            <span className="text-xs text-ink-400" data-testid="mensaje-timestamp">
              {time}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700" data-testid="mensaje-contenido">
            {this.contenido}
          </p>
        </div>
      </div>
    );
  }
}
