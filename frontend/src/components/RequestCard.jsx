import { useState } from "react";
import { Trash2, HelpCircle, Send, CheckCircle } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const RequestCard = ({ request, userId, isGroupAdmin, onUpdate }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replies, setReplies] = useState(request.replies || []);
  const [resolved, setResolved] = useState(request.resolved || false);

  const handleDelete = async () => {
    if (!window.confirm("Excluir este pedido?")) return;
    try {
      await api.delete(`/requests/${request.id}`);
      toast.success("Pedido excluido");
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao excluir");
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/requests/${request.id}/replies`, { content: newReply });
      setReplies([...replies, res.data]);
      setNewReply("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao responder");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId) => {
    try {
      await api.delete(`/requests/replies/${replyId}`);
      setReplies(replies.filter((r) => r.id !== replyId));
      toast.success("Resposta excluida");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao excluir");
    }
  };

  const handleResolve = async () => {
    try {
      await api.put(`/requests/${request.id}/resolve`);
      setResolved(true);
      toast.success("Pedido marcado como resolvido!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao resolver");
    }
  };

  return (
    <div className={`bg-white rounded-xl border ${resolved ? "border-green-300 bg-green-50/30" : "border-dashed border-orange-300"} p-5`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${resolved ? "bg-green-100 text-green-500" : "bg-orange-100 text-orange-500"}`}>
            {resolved ? <CheckCircle size={18} /> : <HelpCircle size={18} />}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{request.author?.name}</p>
            <p className="text-xs text-gray-400">
              {new Date(request.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {resolved && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-medium">Resolvido</span>
          )}
          {(request.authorId === userId || isGroupAdmin) && !resolved && (
            <button
              onClick={handleResolve}
              className="p-1 text-gray-400 hover:text-green-500 transition"
              title="Marcar como resolvido"
            >
              <CheckCircle size={16} />
            </button>
          )}
          {(request.authorId === userId || isGroupAdmin) && (
            <button onClick={handleDelete} className="p-1 text-gray-400 hover:text-red-500 transition">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-gray-800 mb-1">{request.title}</h3>
      {request.description && (
        <p className="text-sm text-gray-600 mb-2">{request.description}</p>
      )}
      {request.category && (
        <span className="inline-block px-2.5 py-0.5 bg-orange-50 text-orange-600 text-xs font-medium rounded-full capitalize">
          {request.category}
        </span>
      )}

      {/* Botao ver respostas */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => setShowReplies(!showReplies)}
          className="text-sm text-gray-400 hover:text-blue-500 transition"
        >
          {showReplies ? "Ocultar respostas" : `Respostas (${replies.length})`}
        </button>
      </div>

      {/* Respostas */}
      {showReplies && (
        <div className="mt-3">
          {replies.length === 0 && (
            <p className="text-xs text-gray-400 mb-2">Nenhuma resposta ainda.</p>
          )}
          <div className="space-y-2 mb-3">
            {replies.map((r) => (
              <div key={r.id} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-medium shrink-0 mt-0.5">
                  {r.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-medium text-gray-700">{r.user?.name}</span>{" "}
                    <span className="text-gray-500">{r.content}</span>
                  </p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {(r.userId === userId || isGroupAdmin) && (
                  <button
                    onClick={() => handleDeleteReply(r.id)}
                    className="p-1 text-gray-300 hover:text-red-500 transition shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Form responder (se nao resolvido) */}
          {!resolved && (
            <form onSubmit={handleReply} className="flex gap-2">
              <input
                type="text"
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Escreva uma resposta..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={submitting || !newReply.trim()}
                className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestCard;
