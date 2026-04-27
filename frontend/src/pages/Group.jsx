import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import GroupCard from "../components/GroupCard";
import Pagination from "../components/Pagination";
import JoinRequestView from "../components/JoinRequestView";
import GroupRecommendationsTab from "../components/GroupRecommendationsTab";
import GroupRequestsTab from "../components/GroupRequestsTab";
import GroupReviewsTab from "../components/GroupReviewsTab";
import GroupMembersTab from "../components/GroupMembersTab";
import {
  Plus,
  Search,
  ArrowLeft,
  Trash2,
  Star,
  HelpCircle,
  Users as UsersIcon,
  LogOut as LeaveIcon,
} from "lucide-react";

const Groups = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (id)
    return (
      <GroupDetail
        id={id}
        user={user}
        navigate={navigate}
        groupPreview={location.state?.groupPreview}
      />
    );
  return <GroupList user={user} navigate={navigate} />;
};

const GroupList = ({ user, navigate }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState("mine"); // "mine" | "explore"

  const fetchGroups = async (currentSearch = search, currentMode = mode) => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (currentMode === "explore" || currentSearch) {
        if (currentSearch) params.search = currentSearch;
        const res = await api.get("/groups", { params });
        setGroups(res.data.groups || []);
        setPagination(res.data.pagination || null);
      } else {
        const res = await api.get("/groups/me", { params });
        setGroups(res.data.groups || []);
        setPagination(res.data.pagination || null);
      }
    } catch (error) {
      console.error("Erro ao buscar grupos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [page, mode]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGroups(search, mode);
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setSearch("");
    setPage(1);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post("/groups", createForm);
      toast.success("Grupo criado!");
      setShowCreate(false);
      setCreateForm({ name: "", description: "" });
      navigate(`/groups/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao criar grupo");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Grupos</h1>
          <p className="text-gray-500 mt-1">
            Gerencie seus grupos ou explore novos
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition text-sm"
        >
          <Plus size={18} />
          Criar grupo
        </button>
      </div>

      {/* Toggle: Meus grupos / Explorar */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => handleModeSwitch("mine")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${mode === "mine" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Meus grupos
        </button>
        <button
          onClick={() => handleModeSwitch("explore")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${mode === "explore" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Explorar grupos
        </button>
      </div>

      {/* Form criar grupo */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Novo grupo
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Nome do grupo
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                required
                placeholder="Ex: Eletricistas da Zona Sul"
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Descrição (opcional)
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                placeholder="Descreva o proposito do grupo..."
                rows={2}
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-60 text-sm"
              >
                {creating ? "Criando..." : "Criar"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="py-2.5 px-6 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Busca */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar grupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Buscar
        </button>
      </form>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Carregando...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Nenhum grupo encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={pagination?.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

const GroupDetail = ({ id, user, navigate, groupPreview }) => {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notMember, setNotMember] = useState(false);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [tab, setTab] = useState("recommendations");
  const [categories, setCategories] = useState([]);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/groups/${id}`);
      setGroup(res.data);
      setNotMember(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setNotMember(true);
        try {
          const myReqs = await api.get("/join-requests/me");
          const pending = (myReqs.data.requests || []).find(
            (r) => r.groupId === id && r.status === "PENDING",
          );
          if (pending) setJoinRequestSent(true);
        } catch {
          /* ignorar */
        }
      } else {
        setError(err.response?.data?.error || "Erro ao carregar grupo");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
    api
      .get("/providers/categories")
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => {});
  }, [id]);

  const isOwner = group?.ownerId === user?.id;
  const isGroupAdmin = group?.members?.some(
    (m) => m.userId === user?.id && m.role === "ADMIN",
  );

  const handleDeleteGroup = async () => {
    if (!window.confirm("Excluir este grupo? Esta ação não pode ser desfeita."))
      return;
    try {
      await api.delete(`/groups/${id}`);
      toast.success("Grupo excluído!");
      navigate("/groups");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao excluir grupo");
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Deseja sair deste grupo?")) return;
    try {
      await api.delete(`/groups/${id}/leave`);
      toast.success("Você saiu do grupo!");
      navigate("/groups");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao sair do grupo");
    }
  };

  if (loading)
    return <div className="text-center py-20 text-gray-400">Carregando...</div>;

  if (notMember) {
    return (
      <JoinRequestView
        id={id}
        navigate={navigate}
        groupPreview={groupPreview}
        joinRequestSent={joinRequestSent}
      />
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-400 text-lg mb-4">{error}</p>
        <button
          onClick={() => navigate("/groups")}
          className="text-blue-600 hover:underline text-sm"
        >
          Voltar para grupos
        </button>
      </div>
    );
  }

  const tabs = [
    { key: "recommendations", label: "Recomendacoes", icon: Star },
    { key: "requests", label: "Pedidos", icon: HelpCircle },
    { key: "reviews", label: "Avaliacoes", icon: Star },
    {
      key: "members",
      label: `Membros (${group.members?.length || 0})`,
      icon: UsersIcon,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate("/groups")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      {/* Info do grupo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{group.name}</h1>
            {group.description && (
              <p className="text-gray-600 mt-2 text-sm">{group.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Criado por {group.owner?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isOwner && (
              <button
                onClick={handleLeaveGroup}
                className="p-2 text-gray-400 hover:text-orange-500 transition"
                title="Sair do grupo"
              >
                <LeaveIcon size={20} />
              </button>
            )}
            {isOwner && (
              <button
                onClick={handleDeleteGroup}
                className="p-2 text-gray-400 hover:text-red-500 transition"
                title="Excluir grupo"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === "recommendations" && (
        <GroupRecommendationsTab
          groupId={id}
          userId={user.id}
          isGroupAdmin={isGroupAdmin}
          categories={categories}
        />
      )}

      {tab === "requests" && (
        <GroupRequestsTab
          groupId={id}
          userId={user.id}
          isGroupAdmin={isGroupAdmin}
          categories={categories}
        />
      )}

      {tab === "reviews" && <GroupReviewsTab groupId={id} />}

      {tab === "members" && (
        <GroupMembersTab
          groupId={id}
          group={group}
          user={user}
          isOwner={isOwner}
          isGroupAdmin={isGroupAdmin}
          onGroupUpdate={fetchGroup}
        />
      )}
    </div>
  );
};

export default Groups;
