import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Plus, HelpCircle } from "lucide-react";
import RequestCard from "./RequestCard";
import Pagination from "./Pagination";

const GroupRequestsTab = ({ groupId, userId, isGroupAdmin, categories }) => {
  const [requests, setRequests] = useState([]);
  const [reqPage, setReqPage] = useState(1);
  const [reqPagination, setReqPagination] = useState(null);
  const [showReqForm, setShowReqForm] = useState(false);
  const [reqForm, setReqForm] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [submittingReq, setSubmittingReq] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await api.get(`/groups/${groupId}/requests`, {
        params: { page: reqPage, limit: 10 },
      });
      setRequests(res.data.requests || []);
      setReqPagination(res.data.pagination || null);
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [reqPage]);

  const handleCreateReq = async (e) => {
    e.preventDefault();
    setSubmittingReq(true);
    try {
      await api.post(`/groups/${groupId}/requests`, reqForm);
      toast.success("Pedido criado!");
      setShowReqForm(false);
      setReqForm({ title: "", description: "", category: "" });
      await fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao criar pedido");
    } finally {
      setSubmittingReq(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowReqForm(!showReqForm)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
        >
          <Plus size={16} />
          Pedir recomendacao
        </button>
      </div>

      {showReqForm && (
        <form
          onSubmit={handleCreateReq}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-4"
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Pedir recomendação
          </h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="O que voce precisa? (ex: Preciso de um eletricista urgente)"
              value={reqForm.title}
              onChange={(e) =>
                setReqForm({ ...reqForm, title: e.target.value })
              }
              required
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <textarea
              placeholder="Descreva o que precisa em detalhes... (opcional)"
              value={reqForm.description}
              onChange={(e) =>
                setReqForm({ ...reqForm, description: e.target.value })
              }
              rows={2}
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
            <select
              value={reqForm.category}
              onChange={(e) =>
                setReqForm({ ...reqForm, category: e.target.value })
              }
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Categoria (opcional)</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submittingReq}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-60 text-sm"
              >
                {submittingReq ? "Enviando..." : "Publicar pedido"}
              </button>
              <button
                type="button"
                onClick={() => setShowReqForm(false)}
                className="py-2.5 px-6 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <HelpCircle size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">Nenhum pedido ainda.</p>
          <p className="text-gray-300 text-sm mt-1">
            Precisa de uma indicação? Peça ao grupo!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              userId={userId}
              isGroupAdmin={isGroupAdmin}
              onUpdate={fetchRequests}
            />
          ))}
        </div>
      )}

      <Pagination
        page={reqPage}
        totalPages={reqPagination?.totalPages}
        onPageChange={setReqPage}
      />
    </div>
  );
};

export default GroupRequestsTab;
