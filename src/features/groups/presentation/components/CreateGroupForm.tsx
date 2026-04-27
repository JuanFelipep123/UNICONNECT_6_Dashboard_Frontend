import { useState } from 'react';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';
import type { Subject, StudyGroupCreatePayload } from '../../domain/groups';

interface CreateGroupFormProps {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  onSubmit: (payload: StudyGroupCreatePayload) => Promise<void>;
}

export function CreateGroupForm({ subjects, loading, error, onSubmit }: CreateGroupFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      name,
      description,
      subject_id: subjectId,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Input label="Nombre del grupo" value={name} onChange={(event) => setName(event.target.value)} />

      <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
        Descripcion
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="rounded-xl border border-ink-300 px-3 py-2.5 text-sm text-ink-900 outline-none ring-brand-500 transition focus:ring-2"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
        Materia
        <select
          value={subjectId}
          onChange={(event) => setSubjectId(event.target.value)}
          className="rounded-xl border border-ink-300 px-3 py-2.5 text-sm text-ink-900 outline-none ring-brand-500 transition focus:ring-2"
        >
          <option value="">Selecciona una materia</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? 'Creando grupo...' : 'Crear grupo'}
      </Button>
    </form>
  );
}
