import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface Slide {
  id: string;
  title: string;
  description: string;
  imageUri: string;
}

const SLIDES: Slide[] = [
  {
    id: 'study-groups',
    title: 'Encontrar grupos de estudio',
    description: 'Encuentra grupos de estudio de tus materias favoritas y conecta con otros estudiantes que comparten tus intereses académicos.',
    imageUri: 'https://bw.grupoaspasia.com/wp-content/uploads/2024/10/estudiar-en-grupo-examenes.jpg',
  },
  {
    id: 'shared-material',
    title: 'Unirse y compartir material',
    description: 'Accede a recursos compartidos por tus compañeros de grupo, y comparte tus propios apuntes y guías de estudio.',
    imageUri: 'https://i.pinimg.com/1200x/9b/c9/b8/9bc9b8466c0f2de9989075c67fcec8f0.jpg',
  },
  {
    id: 'chat',
    title: 'Chatear en tiempo real',
    description: 'Comunícate con tus compañeros de estudio en tiempo real, organiza sesiones y resuelve dudas al instante.',
    imageUri: 'https://i.pinimg.com/1200x/85/06/6b/85066b15cf2635799a39c035f06e0227.jpg',
  },
  {
    id: 'events',
    title: 'Eventos UCaldas',
    description: 'Mantente al tanto de todos los eventos académicos y culturales de la universidad. ¡No te pierdas ni un momento!',
    imageUri: 'https://www.ucaldas.edu.co/portal/wp-content/uploads/2024/10/u-caldas.jpg',
  },
];

export function OnboardingWelcomePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const isLast = step === SLIDES.length - 1;
  const current = SLIDES[step];

  const goTo = (index: number) => {
    const bounded = Math.max(0, Math.min(index, SLIDES.length - 1));
    setStep(bounded);
    trackRef.current?.children[bounded]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  };

  const goNext = () => {
    if (isLast) navigate('/onboarding/step-1');
    else goTo(step + 1);
  };

  const handleSkip = () => navigate('/onboarding/step-1');

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: '#F3F5F7' }}
    >
      <div className="w-full max-w-lg mx-auto flex flex-col" style={{ minHeight: '100vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-8 pb-2">
          <span className="text-2xl font-bold font-serif" style={{ color: '#062E57' }}>UniConnect</span>
          {!isLast && (
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: '#7A8EA8' }}
            >
              Saltar
            </button>
          )}
        </div>

        {/* Slide */}
        <div className="flex-1 flex flex-col px-6 py-4 gap-6">
          {/* Image */}
          <div
            className="w-full rounded-2xl overflow-hidden flex-shrink-0"
            style={{ height: '280px', background: '#E5EAF0' }}
          >
            <img
              key={current.id}
              src={current.imageUri}
              alt={current.title}
              className="w-full h-full object-cover"
              style={{ animation: 'fadeIn 0.35s ease' }}
            />
          </div>

          {/* Text */}
          <div className="text-center space-y-3 px-2">
            <h1
              className="text-3xl font-bold leading-tight font-serif"
              style={{ color: '#062E57' }}
            >
              {current.title}
            </h1>
            <p className="text-base leading-relaxed" style={{ color: '#4C5E76' }}>
              {current.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-10 flex flex-col items-center gap-5">
          {/* Dots */}
          <div className="flex items-center gap-2.5">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? '28px' : '12px',
                  height: '12px',
                  background: i === step ? '#C8A04D' : '#D4DBE5',
                }}
              />
            ))}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={goNext}
            className="w-full py-4 rounded-xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#032D5A', color: '#D7A548' }}
          >
            {isLast ? 'Comenzar Configuración' : 'Siguiente'}
          </button>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
