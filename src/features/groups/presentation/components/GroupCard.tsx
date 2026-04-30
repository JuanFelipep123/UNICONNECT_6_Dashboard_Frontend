import { Link } from 'react-router-dom';
import type { StudyGroup } from '../../domain/groups';

interface GroupCardProps {
  group: StudyGroup;
  /** Accent colour for the top stripe: 'navy' (admin) | 'gold' (participant) */
  accentColor?: 'navy' | 'gold';
}

export function GroupCard({ group, accentColor = 'navy' }: GroupCardProps) {
  // Prefer member_count (always set by the list endpoint).
  // Only fall back to members.length when the array is actually populated,
  // because an empty array returns 0 and short-circuits ??.
  const membersCount =
    group.member_count ??
    (group.members && group.members.length > 0 ? group.members.length : 0);
  const pendingRequestsCount = group.pendingRequests?.length ?? 0;
  const subjectName         = group.subject?.name ?? 'Sin materia';

  // Derive a short "faculty" label from the subject name (first 2 words, uppercase)
  const facultyLabel = subjectName
    .split(' ')
    .slice(0, 3)
    .join(' ')
    .toUpperCase();

  const stripeColor = accentColor === 'gold' ? '#D4AF37' : '#00284D';

  return (
    <div
      className="bg-white rounded-xl overflow-hidden group transition-all duration-200 card-shadow"
      style={{
        border: '1px solid #E9ECEF',
        // hover border is handled with a workaround via inline + CSS group
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#D4AF37';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#E9ECEF';
      }}
    >
      {/* Top colour stripe */}
      <div className="h-1.5" style={{ background: stripeColor }} />

      <div className="p-5">
        {/* Header row: label + role badge */}
        <div className="flex items-start justify-between mb-3">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{
              background: '#f0eded',
              color: '#43474e',
              letterSpacing: '0.08em',
            }}
          >
            {facultyLabel}
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={
              group.is_admin
                ? { background: '#d3e3ff', color: '#001c39', letterSpacing: '0.08em' }
                : { background: '#fed488', color: '#5d4201', letterSpacing: '0.08em' }
            }
          >
            {group.is_admin ? 'Admin' : 'Miembro'}
          </span>
        </div>

        {/* Group name */}
        <h3
          className="text-lg font-semibold mb-1 leading-snug font-serif"
          style={{ color: '#00284D' }}
        >
          {group.name}
        </h3>

        {/* Description / subject */}
        <p className="text-sm mb-4 flex items-center gap-1.5" style={{ color: '#73777f' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            school
          </span>
          {subjectName}
        </p>

        {/* Stats grid */}
        <div
          className="grid grid-cols-2 gap-3 py-3 mb-4"
          style={{ borderTop: '1px solid #f0eded', borderBottom: '1px solid #f0eded' }}
        >
          {/* Members */}
          <div>
            <p
              className="text-[10px] font-bold uppercase mb-1"
              style={{ color: '#73777f', letterSpacing: '0.08em' }}
            >
              Miembros
            </p>
            <div className="flex items-center gap-1">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '16px', color: '#D4AF37' }}
              >
                person
              </span>
              <span className="text-base font-semibold" style={{ color: '#00132a' }}>
                {membersCount}
              </span>
            </div>
          </div>

          {/* Pending requests (admin) OR description second line (member) */}
          {group.is_admin ? (
            <div>
              <p
                className="text-[10px] font-bold uppercase mb-1"
                style={{ color: '#73777f', letterSpacing: '0.08em' }}
              >
                Pendientes
              </p>
              <div className="flex items-center gap-1">
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '16px',
                    color: pendingRequestsCount > 0 ? '#ba1a1a' : '#73777f',
                  }}
                >
                  pending_actions
                </span>
                <span
                  className="text-base font-semibold"
                  style={{ color: pendingRequestsCount > 0 ? '#ba1a1a' : '#73777f' }}
                >
                  {pendingRequestsCount}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p
                className="text-[10px] font-bold uppercase mb-1"
                style={{ color: '#73777f', letterSpacing: '0.08em' }}
              >
                Rol
              </p>
              <div className="flex items-center gap-1">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '16px', color: '#426088' }}
                >
                  group
                </span>
                <span className="text-sm font-medium" style={{ color: '#00132a' }}>
                  Participante
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CTA link */}
        <Link
          to={`/groups/${group.id}`}
          className="flex items-center justify-between text-sm font-semibold transition-transform duration-150 group-hover:translate-x-1"
          style={{ color: '#00284D' }}
        >
          Ver detalle
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            arrow_forward
          </span>
        </Link>
      </div>
    </div>
  );
}
