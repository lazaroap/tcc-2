import { useState, useEffect } from "react";
import api from "../services/api";
import { Bell, CheckCheck } from "lucide-react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications", {
        params: { page, limit: 20 },
      });
      setNotifications(res.data.notifications || []);
      setPagination(res.data.pagination || null);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  };

  const typeLabels = {
    INVITE_RECEIVED: "Convite",
    INVITE_ACCEPTED: "Convite aceito",
    NEW_REVIEW: "Nova avaliação",
    NEW_RECOMMENDATION: "Recomendação",
    NEW_COMMENT: "Comentário",
    NEW_REQUEST_REPLY: "Resposta",
    GROUP_JOINED: "Grupo",
    JOIN_REQUEST_RECEIVED: "Solicitação de entrada",
    JOIN_REQUEST_ACCEPTED: "Solicitação aceita",
    JOIN_REQUEST_REJECTED: "Solicitação recusada",
  };

  const typeColors = {
    INVITE_RECEIVED: "bg-blue-50 text-blue-600",
    INVITE_ACCEPTED: "bg-green-50 text-green-600",
    NEW_REVIEW: "bg-yellow-50 text-yellow-600",
    NEW_RECOMMENDATION: "bg-purple-50 text-purple-600",
    NEW_COMMENT: "bg-indigo-50 text-indigo-600",
    NEW_REQUEST_REPLY: "bg-orange-50 text-orange-600",
    GROUP_JOINED: "bg-teal-50 text-teal-600",
    JOIN_REQUEST_RECEIVED: "bg-amber-50 text-amber-600",
    JOIN_REQUEST_ACCEPTED: "bg-green-50 text-green-600",
    JOIN_REQUEST_REJECTED: "bg-red-50 text-red-600",
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notificações</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Fique por dentro das novidades
          </p>
        </div>
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
          >
            <CheckCheck size={16} />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Carregando...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-lg">Nenhuma notificação</p>
          <p className="text-gray-300 text-sm mt-1">
            Quando algo acontecer, você verá aqui
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && handleMarkAsRead(n.id)}
              className={`bg-white rounded-xl border p-4 transition cursor-pointer ${
                n.read
                  ? "border-gray-100 opacity-70"
                  : "border-blue-200 hover:border-blue-300 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1.5 ${
                      typeColors[n.type] || "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {typeLabels[n.type] || n.type}
                  </span>
                  <p
                    className={`text-sm ${n.read ? "text-gray-500" : "text-gray-800 font-medium"}`}
                  >
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginacao */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">
            {page} de {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page === pagination.totalPages}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Próximo
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
