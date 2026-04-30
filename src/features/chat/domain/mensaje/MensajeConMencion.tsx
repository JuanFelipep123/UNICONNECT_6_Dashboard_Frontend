import type { ReactNode } from 'react';
import type { IMensaje } from './IMensaje';
import { MensajeDecorador } from './MensajeDecorador';

// Content-modifying decorator: retrieves data from the wrapped component via
// getContenido() / getMetadata() (delegation), then re-renders the message
// with @mention tokens highlighted (extension). This is necessary because the
// base render() outputs an opaque ReactNode that cannot have its inner text
// replaced after the fact.

export class MensajeConMencion extends MensajeDecorador {
  constructor(
    mensaje: IMensaje,
    private readonly usuariosMencionados: string[],
  ) {
    super(mensaje);
  }

  private resaltarMenciones(texto: string): ReactNode[] {
    const tokens = texto.split(/(@\w+)/g);
    return tokens.map((token, i) => {
      const esMencion = this.usuariosMencionados.some(
        (u) => token === `@${u}` || token.toLowerCase() === `@${u.toLowerCase()}`,
      );
      return esMencion ? (
        <mark
          key={i}
          className="rounded bg-brand-100 px-0.5 font-semibold text-brand-800"
          data-testid="mencion-resaltada"
        >
          {token}
        </mark>
      ) : (
        <span key={i}>{token}</span>
      );
    });
  }

  override render(): ReactNode {
    const contenido = this.wrapped.getContenido();
    const meta = this.wrapped.getMetadata();
    const userId = String(meta.userId ?? '');
    const timestamp = meta.timestamp instanceof Date ? meta.timestamp : new Date();

    const time = timestamp.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div className="flex gap-3" data-testid="mensaje-con-mencion">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-900">
          {userId.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-ink-500">{userId}</span>
            <span className="text-xs text-ink-400">{time}</span>
          </div>
          <p
            className="mt-1 whitespace-pre-wrap text-sm text-ink-700"
            data-testid="mensaje-contenido-con-menciones"
          >
            {this.resaltarMenciones(contenido)}
          </p>
        </div>
      </div>
    );
  }
}
