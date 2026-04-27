import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import ProviderDashboard from "../components/ProviderDashboard";
import { Check, X, Users, Camera } from "lucide-react";

const API_BASE = "http://localhost:3000";

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    avatar: "",
  });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [providerForm, setProviderForm] = useState({ category: "", bio: "" });
  const [provider, setProvider] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [invites, setInvites] = useState([]);
  const [respondingInvite, setRespondingInvite] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "provider"

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me");
        const u = res.data;
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          age: u.age || "",
          gender: u.gender || "",
          avatar: u.avatar || "",
        });

        if (u.provider) {
          setProvider(u.provider);
          setProviderForm({
            category: u.provider.category || "",
            bio: u.provider.bio || "",
          });
        }

        const [invRes, catRes] = await Promise.all([
          api.get("/invites/me"),
          api.get("/providers/categories"),
        ]);
        setInvites(invRes.data.invites || []);
        setCategories(catRes.data.categories || []);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [user.id]);

  const handleInviteResponse = async (inviteId, action) => {
    setRespondingInvite(inviteId);
    try {
      await api.put(`/invites/${inviteId}/${action}`);
      toast.success(
        action === "accept"
          ? "Convite aceito! Você entrou no grupo."
          : "Convite recusado.",
      );
      setInvites(invites.filter((inv) => inv.id !== inviteId));
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao responder convite");
    } finally {
      setRespondingInvite(null);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setUploadingAvatar(true);
    try {
      const res = await api.post("/upload/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm({ ...form, avatar: res.data.avatar });
      const stored = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem(
        "user",
        JSON.stringify({ ...stored, avatar: res.data.avatar }),
      );
      window.dispatchEvent(new Event("storage"));
      toast.success("Foto atualizada!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao enviar imagem");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChange = (e) => {
    const value =
      e.target.name === "age"
        ? e.target.value
          ? parseInt(e.target.value)
          : ""
        : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form };
      if (password) data.password = password;
      if (data.age === "") delete data.age;
      await api.put(`/users/${user.id}`, data);
      const stored = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem(
        "user",
        JSON.stringify({ ...stored, name: form.name, email: form.email }),
      );
      window.dispatchEvent(new Event("storage"));
      toast.success("Perfil atualizado!");
      setPassword("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (provider) {
        await api.put(`/providers/${provider.id}`, providerForm);
        setProvider({ ...provider, ...providerForm });
        toast.success("Perfil de prestador atualizado!");
      } else {
        const res = await api.post("/providers", providerForm);
        setProvider(res.data);
        const stored = JSON.parse(localStorage.getItem("user"));
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...stored,
            provider: { id: res.data.id, category: res.data.category },
          }),
        );
        window.dispatchEvent(new Event("storage"));
        toast.success("Você agora é um prestador!");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao salvar prestador");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return <div className="text-center py-20 text-gray-400">Carregando...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Meu Perfil</h1>

      {/* Convites pendentes */}
      {invites.length > 0 && (
        <div className="bg-white rounded-xl border border-dashed border-blue-400 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            Convites para grupos ({invites.length})
          </h2>
          <div className="space-y-3">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {inv.group?.name}
                  </p>
                  {inv.group?.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {inv.group.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Convidado por {inv.sender?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleInviteResponse(inv.id, "accept")}
                    disabled={respondingInvite === inv.id}
                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition disabled:opacity-60"
                  >
                    <Check size={16} /> Aceitar
                  </button>
                  <button
                    onClick={() => handleInviteResponse(inv.id, "reject")}
                    disabled={respondingInvite === inv.id}
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition disabled:opacity-60"
                  >
                    <X size={16} /> Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === "profile" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Dados pessoais
        </button>
        <button
          onClick={() => setActiveTab("provider")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === "provider" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          {provider ? "Meu perfil de prestador" : "Tornar-se prestador"}
        </button>
      </div>

      {activeTab === "profile" && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Dados pessoais
          </h2>

          <div className="flex items-center gap-5 mb-6">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {form.avatar ? (
                <img
                  src={`${API_BASE}${form.avatar}`}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl font-bold border-2 border-gray-200">
                  {form.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Camera size={20} className="text-white" />
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                {uploadingAvatar ? "Enviando..." : "Alterar foto"}
              </button>
              <p className="text-xs text-gray-400 mt-0.5">
                JPEG, PNG ou WebP. Max 2MB.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Idade</label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                min="1"
                max="120"
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Gênero
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione</option>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Feminino</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Nova senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Deixe vazio para manter"
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      )}

      {/* Aba: Prestador */}
      {activeTab === "provider" && (
        <div className="space-y-6">
          <form
            onSubmit={handleProviderSubmit}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {provider
                ? "Editar perfil de prestador"
                : "Cadastrar como prestador"}
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Categoria
                </label>
                <select
                  value={providerForm.category}
                  onChange={(e) =>
                    setProviderForm({
                      ...providerForm,
                      category: e.target.value,
                    })
                  }
                  required
                  className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Bio / Descrição
                </label>
                <textarea
                  value={providerForm.bio}
                  onChange={(e) =>
                    setProviderForm({ ...providerForm, bio: e.target.value })
                  }
                  placeholder="Descreva seus serviços e experiência..."
                  rows={3}
                  className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-60"
              >
                {provider ? "Atualizar" : "Cadastrar como prestador"}
              </button>
              {provider && (
                <Link
                  to={`/providers/${provider.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver meu perfil público
                </Link>
              )}
            </div>
          </form>

          {provider && <ProviderDashboard providerId={provider.id} />}
        </div>
      )}
    </div>
  );
};

export default Profile;
