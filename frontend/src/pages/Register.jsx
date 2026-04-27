import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      return setError("As senhas não coincidem");
    }

    if (form.password.length < 8) {
      return setError("A senha deve ter ao menos 8 caracteres");
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Conta criada com sucesso!");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex w-1/2 bg-blue-600 flex-col items-center justify-center gap-6 p-10">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <span className="text-blue-600 text-4xl font-black tracking-tight">
              Conecta<span className="text-blue-400">Serv</span>
            </span>
          </div>
          <p className="text-blue-100 text-lg text-center max-w-sm">
            Crie sua conta e conecte-se aos melhores prestadores de serviço
          </p>
        </div>
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
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>
      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center bg-blue-50 p-6">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md mx-4">
          <div className="flex md:hidden justify-center mb-6">
            <span className="text-blue-600 text-3xl font-black">
              Conecta<span className="text-blue-400">Serv</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">Criar conta</h2>
          <p className="text-gray-500 text-sm mb-6">
            Preencha seus dados para se cadastrar
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <input
                type="text"
                name="name"
                placeholder="Seu nome"
                value={form.name}
                onChange={handleChange}
                required
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={handleChange}
                required
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                name="password"
                placeholder="Minimo 8 caracteres"
                value={form.password}
                onChange={handleChange}
                required
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Confirmar senha
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Repita a senha"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <p className="text-sm text-gray-500">
              Já tem conta?{" "}
              <Link
                to="/login"
                className="text-blue-600 font-medium hover:underline"
              >
                Faça login
              </Link>
            </p>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
