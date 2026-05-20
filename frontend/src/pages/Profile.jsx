import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-950 flex items-center justify-center">
      <h1 className="text-white text-6xl font-bold">{user}</h1>
    </div>
  );
}
