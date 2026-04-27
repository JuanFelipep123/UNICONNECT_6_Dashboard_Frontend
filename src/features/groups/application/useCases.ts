import type { StudyGroupCreatePayload } from '../domain/groups';

export const validateCreateGroupPayload = (payload: StudyGroupCreatePayload): string | null => {
  if (!payload.name.trim()) return 'El nombre del grupo es obligatorio.';
  if (!payload.description.trim()) return 'La descripcion del grupo es obligatoria.';
  if (!payload.subject_id.trim()) return 'Debes seleccionar una materia.';
  return null;
};
