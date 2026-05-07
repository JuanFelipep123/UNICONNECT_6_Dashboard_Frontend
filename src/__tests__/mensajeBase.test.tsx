import { render, screen } from '@testing-library/react';
import { MensajeBase, MensajeConArchivo } from '@features/chat/domain/mensaje';

const CONTENIDO = 'Texto del mensaje de prueba';
const USER_ID = 'user001';
const TIMESTAMP = new Date('2026-05-06T22:00:00Z');

describe('MensajeBase', () => {
  it('render() contiene el texto pasado al constructor', () => {
    const msg = new MensajeBase(CONTENIDO, USER_ID, TIMESTAMP);
    render(<>{msg.render()}</>);
    expect(screen.getByTestId('mensaje-contenido')).toHaveTextContent(CONTENIDO);
  });

  it('render() NO contiene data-testid de archivo, menciones ni reacciones', () => {
    const msg = new MensajeBase(CONTENIDO, USER_ID, TIMESTAMP);
    render(<>{msg.render()}</>);
    expect(screen.queryByTestId('archivo-bloque')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mencion-resaltada')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reacciones-fila')).not.toBeInTheDocument();
  });

  it('getContenido() retorna exactamente el string del constructor', () => {
    const msg = new MensajeBase(CONTENIDO, USER_ID, TIMESTAMP);
    expect(msg.getContenido()).toBe(CONTENIDO);
  });

  it('getMetadata() contiene userId y timestamp pero NO campos de archivo', () => {
    const msg = new MensajeBase(CONTENIDO, USER_ID, TIMESTAMP);
    const meta = msg.getMetadata();
    expect(meta.userId).toBe(USER_ID);
    expect(meta.timestamp).toEqual(TIMESTAMP);
    expect(meta.url).toBeUndefined();
    expect(meta.mimeType).toBeUndefined();
    expect(meta.tamano).toBeUndefined();
  });
});

describe('MensajeConArchivo wrapping MensajeBase', () => {
  const base = new MensajeBase(CONTENIDO, USER_ID, TIMESTAMP);
  const decorated = new MensajeConArchivo(
    base,
    'https://storage.example.com/informe.pdf',
    'application/pdf',
    204800,
    'informe.pdf',
  );

  it('render() incluye el bloque de archivo', () => {
    render(<>{decorated.render()}</>);
    expect(screen.getByTestId('archivo-bloque')).toBeInTheDocument();
  });

  it('render() sigue mostrando el texto original del MensajeBase wrapped', () => {
    render(<>{decorated.render()}</>);
    expect(screen.getByTestId('mensaje-contenido')).toHaveTextContent(CONTENIDO);
  });

  it('getContenido() propaga correctamente al wrapped', () => {
    expect(decorated.getContenido()).toBe(CONTENIDO);
  });

  it('MensajeBase sin decorar NO tiene bloque de archivo', () => {
    render(<>{base.render()}</>);
    expect(screen.queryByTestId('archivo-bloque')).not.toBeInTheDocument();
  });
});
