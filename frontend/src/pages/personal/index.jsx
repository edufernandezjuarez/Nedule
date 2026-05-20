import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Personal() {
  const navigate = useNavigate();
  const { canAccessPersonal } = useAuth();

  return (
    <div className="min-h-screen bg-surface">
      <div className="px-5 py-4 border-b border-white/[0.08]">
        <span className="text-lg font-bold text-content">❤️ Personal</span>
      </div>
      <div className="flex items-center justify-center gap-6 p-8 flex-wrap min-h-[calc(100vh-9rem)]">
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
    </div>
  );
}
