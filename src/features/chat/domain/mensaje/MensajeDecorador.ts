import type { ReactNode } from 'react';
import type { IMensaje } from './IMensaje';

export abstract class MensajeDecorador implements IMensaje {
  protected readonly wrapped: IMensaje;

  constructor(mensaje: IMensaje) {
    this.wrapped = mensaje;
  }

  getContenido(): string {
    return this.wrapped.getContenido();
  }

  getMetadata(): Record<string, unknown> {
    return this.wrapped.getMetadata();
  }

  render(): ReactNode {
    return this.wrapped.render();
  }
}
