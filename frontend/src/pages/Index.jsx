import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const navigate = useNavigate();
  const { canAccessPersonal } = useAuth();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-surface flex items-center justify-center gap-6 p-8 flex-wrap">
      <button
        onClick={() => navigate('/peliculas')}
        className="text-content text-xl font-bold bg-surface-alt hover:bg-surface-alt/80 px-10 py-8 rounded-2xl transition-colors"
      >
        🎬 Pelis
      </button>
      <button
        onClick={() => navigate('/juegos')}
        className="text-content text-xl font-bold bg-surface-alt hover:bg-surface-alt/80 px-10 py-8 rounded-2xl transition-colors"
      >
        🎮 Juegos
      </button>
      {canAccessPersonal && (
        <button
          onClick={() => navigate('/personal')}
          className="text-content text-xl font-bold bg-surface-alt hover:bg-surface-alt/80 px-10 py-8 rounded-2xl transition-colors"
        >
          🏠 Personal
        </button>
      )}
    </div>
  );
}
