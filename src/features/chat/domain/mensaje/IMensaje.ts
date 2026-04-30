import type { ReactNode } from 'react';

export interface IMensaje {
  getContenido(): string;
  getMetadata(): Record<string, unknown>;
  render(): ReactNode;
}
