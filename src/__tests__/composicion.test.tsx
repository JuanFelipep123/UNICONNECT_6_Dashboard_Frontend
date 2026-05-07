import { render, screen } from '@testing-library/react';
import {
  MensajeBase,
  MensajeConArchivo,
  MensajeConMencion,
  MensajeConReaccion,
  type Reaccion,
} from '@features/chat/domain/mensaje';

// Restricción de composición documentada en README.md:
// MensajeConMencion re-renderiza el mensaje desde cero para poder resaltar
// @menciones en el texto (ReactNode es opaco y no permite modificar su
// contenido interno). Por ello debe ser el decorador más interno.
// Los decoradores aditivos (MensajeConArchivo, MensajeConReaccion)
// llaman a this.wrapped.render() y pueden encadenarse por fuera.
//   Orden correcto: MensajeConReaccion(MensajeConArchivo(MensajeConMencion(MensajeBase)))

const USER_ID = 'user001';
const CONTENIDO = 'Hola @juan revisa el informe';
const TIMESTAMP = new Date('2026-05-06T22:00:00Z');
const REACCIONES: Reaccion[] = [
  { emoji: '👍', count: 2, users: ['user002', 'user003'] },
];

// ──────────────────────────────────────────────────────────
// Caso 1: archivo + menciones
// MensajeConArchivo( MensajeConMencion( MensajeBase ) )
// ──────────────────────────────────────────────────────────
describe('Composición — archivo + menciones', () => {
  it('render() incluye TANTO el bloque de archivo COMO la mención resaltada', () => {
    const chain = new MensajeConArchivo(
      new MensajeConMencion(
        new MensajeBase(CONTENIDO, USER_ID, TIMESTAMP),
        ['juan'],
      ),
      'https://storage.example.com/informe.pdf',
      'application/pdf',
      204800,
      'informe.pdf',
    );
    render(<>{chain.render()}</>);
    expect(screen.getByTestId('archivo-bloque')).toBeInTheDocument();
    expect(screen.getByTestId('mencion-resaltada')).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────
// Caso 2: menciones + reacciones (sin archivo)
// MensajeConReaccion( MensajeConMencion( MensajeBase ) )
// ──────────────────────────────────────────────────────────
describe('Composición — menciones + reacciones', () => {
  it('render() incluye menciones Y reacciones', () => {
    const chain = new MensajeConReaccion(
      new MensajeConMencion(
        new MensajeBase(CONTENIDO, USER_ID, TIMESTAMP),
        ['juan'],
      ),
      REACCIONES,
    );
    render(<>{chain.render()}</>);
    expect(screen.getByTestId('mencion-resaltada')).toBeInTheDocument();
    expect(screen.getByTestId('reacciones-fila')).toBeInTheDocument();
  });

  it('render() NO incluye bloque de archivo (ningún MensajeConArchivo en la cadena)', () => {
    const chain = new MensajeConReaccion(
      new MensajeConMencion(
        new MensajeBase(CONTENIDO, USER_ID, TIMESTAMP),
        ['juan'],
      ),
      REACCIONES,
    );
    render(<>{chain.render()}</>);
    expect(screen.queryByTestId('archivo-bloque')).not.toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────
// Caso 3: los tres decoradores encadenados
// MensajeConReaccion( MensajeConArchivo( MensajeConMencion( MensajeBase ) ) )
// ──────────────────────────────────────────────────────────
describe('Composición — archivo + menciones + reacciones', () => {
  it('render() incluye los tres: archivo, mención resaltada Y reacciones', () => {
    const chain = new MensajeConReaccion(
      new MensajeConArchivo(
        new MensajeConMencion(
          new MensajeBase(CONTENIDO, USER_ID, TIMESTAMP),
          ['juan'],
        ),
        'https://storage.example.com/informe.pdf',
        'application/pdf',
        204800,
        'informe.pdf',
      ),
      REACCIONES,
    );
    render(<>{chain.render()}</>);
    expect(screen.getByTestId('archivo-bloque')).toBeInTheDocument();
    expect(screen.getByTestId('mencion-resaltada')).toBeInTheDocument();
    expect(screen.getByTestId('reacciones-fila')).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────
// Caso 4: propagación de getContenido() por toda la cadena
// ──────────────────────────────────────────────────────────
describe('getContenido() — propagación por la cadena completa', () => {
  it('el decorador más externo devuelve el mismo texto que el MensajeBase original', () => {
    const chain = new MensajeConReaccion(
      new MensajeConArchivo(
        new MensajeConMencion(
          new MensajeBase(CONTENIDO, USER_ID, TIMESTAMP),
          ['juan'],
        ),
        'https://storage.example.com/informe.pdf',
        'application/pdf',
        204800,
        'informe.pdf',
      ),
      REACCIONES,
    );
    expect(chain.getContenido()).toBe(CONTENIDO);
  });
});
