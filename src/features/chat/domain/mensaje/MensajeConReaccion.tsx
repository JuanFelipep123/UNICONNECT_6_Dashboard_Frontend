import type { ReactNode } from 'react';
import type { IMensaje } from './IMensaje';
import { MensajeDecorador } from './MensajeDecorador';

export interface Reaccion {
  emoji: string;
  count: number;
  users: string[];
}

export class MensajeConReaccion extends MensajeDecorador {
  constructor(
    mensaje: IMensaje,
    private readonly reacciones: Reaccion[],
  ) {
    super(mensaje);
  }

  override render(): ReactNode {
    return (
      <div data-testid="mensaje-con-reaccion">
        {this.wrapped.render()}
        {this.reacciones.length > 0 && (
          <div
            className="ml-12 mt-1 flex flex-wrap gap-1"
            data-testid="reacciones-fila"
          >
            {this.reacciones.map((r, i) => (
              <button
                key={i}
                type="button"
                title={r.users.join(', ')}
                className="flex items-center gap-1 rounded-full border border-ink-100 bg-ink-50 px-2 py-0.5 text-sm transition hover:bg-ink-100"
                data-testid="reaccion-chip"
              >
                <span>{r.emoji}</span>
                <span className="text-xs font-medium text-ink-700">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
}
