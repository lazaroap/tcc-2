import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { UserPlus, UserMinus, UserCheck, UserX, Clock } from "lucide-react";

const GroupMembersTab = ({
  groupId,
  group,
  user,
  isOwner,
  isGroupAdmin,
  onGroupUpdate,
}) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);

  const fetchInvites = async () => {
    try {
      const res = await api.get(`/groups/${groupId}/invites`);
      setPendingInvites(res.data.invites || []);
    } catch (err) {
      console.error("Erro ao buscar convites:", err);
    }
  };

  const fetchJoinRequests = async () => {
    try {
      const res = await api.get(`/groups/${groupId}/join-requests`);
      setJoinRequests(res.data.requests || []);
    } catch (err) {
      console.error("Erro ao buscar solicitações de entrada:", err);
    }
  };

  useEffect(() => {
    fetchInvites();
    if (isOwner || isGroupAdmin) fetchJoinRequests();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.post(`/groups/${groupId}/invites`, { email: inviteEmail });
      toast.success("Convite enviado!");
      setInviteEmail("");
      await fetchInvites();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao enviar convite");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!window.confirm("Remover este membro?")) return;
    try {
      await api.delete(`/groups/${groupId}/members/${memberUserId}`);
      toast.success("Membro removido!");
      await onGroupUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao remover membro");
    }
  };

  const handleAcceptJoin = async (requestId) => {
    try {
      await api.put(`/join-requests/${requestId}/accept`);
      toast.success("Solicitação aceita!");
      await fetchJoinRequests();
      await onGroupUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao aceitar");
    }
  };

  const handleRejectJoin = async (requestId) => {
    try {
      await api.put(`/join-requests/${requestId}/reject`);
      toast.success("Solicitação recusada.");
      await fetchJoinRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao recusar");
    }
  };

  return (
    <div>
      <form
        onSubmit={handleInvite}
        className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <UserPlus size={20} />
          Convidar membro
        </h2>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Email do usuário"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={inviting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition disabled:opacity-60 text-sm"
          >
            {inviting ? "Enviando..." : "Convidar"}
          </button>
        </div>
      </form>

      {(isOwner || isGroupAdmin) && joinRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-dashed border-green-300 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-green-500" />
            Solicitações de entrada ({joinRequests.length})
          </h3>
          <div className="space-y-2">
            {joinRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-medium text-sm">
                    {req.user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {req.user?.name}
                    </p>
                    <p className="text-xs text-gray-400">{req.user?.email}</p>
                    {req.message && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">
                        &quot;{req.message}&quot;
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAcceptJoin(req.id)}
                    className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition"
                    title="Aceitar"
                  >
                    <UserCheck size={18} />
                  </button>
                  <button
                    onClick={() => handleRejectJoin(req.id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
                    title="Recusar"
                  >
                    <UserX size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingInvites.length > 0 && (
        <div className="bg-white rounded-xl border border-dashed border-blue-300 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Convites pendentes
          </h3>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-medium text-sm">
                    {inv.receiver?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {inv.receiver?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {inv.receiver?.email}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600">
                  Pendente
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de membros */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Membros ({group.members?.length || 0})
        </h3>
        <div className="space-y-3">
          {group.members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium text-sm">
                  {member.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {member.user?.name}
                  </p>
                  <p className="text-xs text-gray-400">{member.user?.email}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    member.role === "ADMIN"
                      ? "bg-purple-50 text-purple-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {member.role === "ADMIN" ? "Admin" : "Membro"}
                </span>
              </div>
              {isOwner && member.userId !== user.id && (
                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition"
                  title="Remover membro"
                >
                  <UserMinus size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupMembersTab;
