import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { loginRequest } from '../../api/auth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!username || !password) return;

    try {
      const data = await loginRequest(username, password);
      login(data.username, data.token);
      navigate('/');
    } catch {
      setPassword('');
      setError('Usuario o contraseña incorrectos');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-8 rounded-2xl w-full max-w-sm flex flex-col gap-4 shadow-xl"
      >
        <h1 className="text-white text-2xl font-bold text-center tracking-tight">Nedule</h1>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-yellow-500 text-black font-bold py-2.5 rounded-lg hover:bg-yellow-400 transition-colors"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
