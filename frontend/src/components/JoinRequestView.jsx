import { useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, UserPlus, Users as UsersIcon, Clock } from "lucide-react";

const JoinRequestView = ({
  id,
  navigate,
  groupPreview,
  joinRequestSent: initialSent,
}) => {
  const [joinMessage, setJoinMessage] = useState("");
  const [requestingJoin, setRequestingJoin] = useState(false);
  const [joinRequestSent, setJoinRequestSent] = useState(initialSent);

  const handleRequestJoin = async (e) => {
    e.preventDefault();
    setRequestingJoin(true);
    try {
      await api.post(`/groups/${id}/join-requests`, {
        message: joinMessage || undefined,
      });
      toast.success("Solicitacao enviada!");
      setJoinRequestSent(true);
      setJoinMessage("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao enviar solicitacao");
    } finally {
      setRequestingJoin(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate("/groups")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mx-auto mb-4">
          <UsersIcon size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          {groupPreview?.name || "Grupo privado"}
        </h2>
        {groupPreview?.description && (
          <p className="text-gray-500 text-sm mb-4">
            {groupPreview.description}
          </p>
        )}
        {groupPreview?._count?.members && (
          <p className="text-xs text-gray-400 mb-6">
            {groupPreview._count.members} membros
          </p>
        )}

        {joinRequestSent ? (
          <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 rounded-lg py-3 px-4">
            <Clock size={18} />
            <span className="text-sm font-medium">
              Solicitação enviada! Aguardando aprovação.
            </span>
          </div>
        ) : (
          <form onSubmit={handleRequestJoin} className="max-w-sm mx-auto">
            <p className="text-sm text-gray-500 mb-4">
              Você não é membro deste grupo. Envie uma solicitação para
              participar.
            </p>
            <textarea
              placeholder="Mensagem (opcional)"
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
            />
            <button
              type="submit"
              disabled={requestingJoin}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-60 text-sm"
            >
              <UserPlus size={16} />
              {requestingJoin ? "Enviando..." : "Pedir para participar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default JoinRequestView;
