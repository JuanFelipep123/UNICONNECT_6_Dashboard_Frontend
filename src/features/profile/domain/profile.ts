export interface ProfileSubject {
  id: string;
  name: string;
  code?: string;
  career?: string;
  program?: string;
}

export interface ProfileData {
  id: string;
  name?: string;
  email?: string;
  avatar_url?: string | null;
  career?: string | null;
  semester?: number | null;
  phone_number?: string | null;
  created_at?: string;
  materias?: ProfileSubject[];
}

export interface Career {
  value: string;
  label: string;
}

export interface Semester {
  value: string;
  label: string;
}

export const CAREERS: Career[] = [
  { value: 'Ingeniería de sistemas', label: 'Ingeniería de sistemas' },
  { value: 'Derecho', label: 'Derecho' },
  { value: 'Ingeniería Agronómica', label: 'Ingeniería Agronómica' },
  { value: 'Diseño Visual', label: 'Diseño Visual' },
  { value: 'Licenciatura en Educación Física', label: 'Lic. en Educación Física' },
  { value: 'Medicina', label: 'Medicina' },
  { value: 'Enfermería', label: 'Enfermería' },
  { value: 'Artes Plásticas', label: 'Artes Plásticas' },
  { value: 'Desarrollo Familiar', label: 'Desarrollo Familiar' },
  { value: 'Geología', label: 'Geología' },
  { value: 'Ingeniería de Alimentos', label: 'Ingeniería de Alimentos' },
  { value: 'Biología', label: 'Biología' },
  { value: 'Antropología', label: 'Antropología' },
  { value: 'Filosofía y Letras', label: 'Filosofía y Letras' },
];

export const SEMESTERS: Semester[] = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));
