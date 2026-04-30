import { useState } from 'react';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';
import type { Subject, StudyGroupCreatePayload } from '../../domain/groups';

const fieldStyle: React.CSSProperties = {
  borderColor: '#CED4DA',
  color: '#1b1c1c',
  borderRadius: '12px',
  border: '1px solid #CED4DA',
  padding: '10px 12px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  width: '100%',
};

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
    await onSubmit({ name, description, subject_id: subjectId });
  };

  const focusStyle = (el: HTMLElement) => {
    el.style.borderColor = '#00284D';
    el.style.boxShadow = '0 0 0 3px rgba(0,40,77,0.10)';
  };
  const blurStyle = (el: HTMLElement) => {
    el.style.borderColor = '#CED4DA';
    el.style.boxShadow = 'none';
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Input
        label="Nombre del grupo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <label
        className="flex flex-col gap-1.5 text-sm font-medium"
        style={{ color: '#43474e' }}
      >
        Descripción
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={fieldStyle}
          onFocus={(e) => focusStyle(e.currentTarget)}
          onBlur={(e) => blurStyle(e.currentTarget)}
        />
      </label>

      <label
        className="flex flex-col gap-1.5 text-sm font-medium"
        style={{ color: '#43474e' }}
      >
        Materia
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          style={fieldStyle}
          onFocus={(e) => focusStyle(e.currentTarget)}
          onBlur={(e) => blurStyle(e.currentTarget)}
        >
          <option value="">Selecciona una materia</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </label>

      {error ? (
        <p
          className="text-sm font-medium rounded-lg px-3 py-2"
          style={{ color: '#ba1a1a', background: '#ffdad6' }}
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creando grupo...' : 'Crear grupo'}
      </Button>
    </form>
  );
}
