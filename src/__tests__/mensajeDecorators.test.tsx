import { render, screen } from '@testing-library/react';
import {
  MensajeBase,
  MensajeConMencion,
  MensajeConReaccion,
  type Reaccion,
} from '@features/chat/domain/mensaje';

const USER_ID = 'user001';
const TIMESTAMP = new Date('2026-05-06T22:00:00Z');

// MensajeConMencion usa /@\w+/g para tokenizar, por lo que los ids
// de usuario no deben contener guiones.
describe('MensajeConMencion wrapping MensajeBase', () => {
  it('render() incluye mención resaltada cuando el contenido tiene @usuario', () => {
    const base = new MensajeBase('Hola @juan revisa esto', USER_ID, TIMESTAMP);
    const decorated = new MensajeConMencion(base, ['juan']);
    render(<>{decorated.render()}</>);
    const mark = screen.getByTestId('mencion-resaltada');
    expect(mark).toBeInTheDocument();
    expect(mark).toHaveTextContent('@juan');
  });

  it('MensajeBase sin decorar NO incluye mención resaltada', () => {
    const base = new MensajeBase('Hola @juan revisa esto', USER_ID, TIMESTAMP);
    render(<>{base.render()}</>);
    expect(screen.queryByTestId('mencion-resaltada')).not.toBeInTheDocument();
  });
});

describe('MensajeConReaccion wrapping MensajeBase', () => {
  const reacciones: Reaccion[] = [
    { emoji: '👍', count: 3, users: ['user002', 'user003', 'user004'] },
  ];

  it('render() incluye la fila de reacciones', () => {
    const base = new MensajeBase('Mensaje de prueba', USER_ID, TIMESTAMP);
    const decorated = new MensajeConReaccion(base, reacciones);
    render(<>{decorated.render()}</>);
    expect(screen.getByTestId('reacciones-fila')).toBeInTheDocument();
  });

  it('render() muestra el emoji y el count pasados al constructor', () => {
    const base = new MensajeBase('Mensaje de prueba', USER_ID, TIMESTAMP);
    const decorated = new MensajeConReaccion(base, reacciones);
    render(<>{decorated.render()}</>);
    const chip = screen.getByTestId('reaccion-chip');
    expect(chip).toHaveTextContent('👍');
    expect(chip).toHaveTextContent('3');
  });

  it('MensajeBase sin decorar NO incluye fila de reacciones', () => {
    const base = new MensajeBase('Mensaje de prueba', USER_ID, TIMESTAMP);
    render(<>{base.render()}</>);
    expect(screen.queryByTestId('reacciones-fila')).not.toBeInTheDocument();
  });
});
