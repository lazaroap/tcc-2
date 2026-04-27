import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Lado esquerdo — imagem + logo */}
      <div className="hidden md:flex w-1/2 bg-blue-600 flex-col items-center justify-center gap-6 p-10">
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <span className="text-blue-600 text-4xl font-black tracking-tight">
              Conecta<span className="text-blue-400">Serv</span>
            </span>
          </div>
          <p className="text-blue-100 text-lg text-center max-w-sm">
            Conecte-se aos melhores prestadores de serviço da sua região
          </p>
        </div>

        {/* Ilustração */}
        <div className="w-72 h-72 bg-blue-500 rounded-3xl flex items-center justify-center shadow-inner">
          <svg
            className="w-48 h-48 text-blue-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-blue-50 p-6">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md mx-4">
          {/* Logo mobile */}
          <div className="flex md:hidden justify-center mb-6">
            <span className="text-blue-600 text-3xl font-black">
              Conecta<span className="text-blue-400">Serv</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">Bem-vindo!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Faça login para continuar
          </p>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Criar conta */}
            <p className="text-sm text-gray-500">
              Não tem conta?{" "}
              <Link
                to="/register"
                className="text-blue-600 font-medium hover:underline"
              >
                Crie a sua aqui
              </Link>
            </p>

            {/* Botão login */}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            {/* Divisor OU */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-sm">OU</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
