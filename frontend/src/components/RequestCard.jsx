import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Trash2, HelpCircle, Send, CheckCircle, X } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const WhatsappIcon = ({ size = 14 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.057 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.889-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.473-8.413z" />
  </svg>
);

const buildWhatsappLink = (rawPhone, requestTitle) => {
  const digits = (rawPhone || "").replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const msg = encodeURIComponent(
    `Olá! Vi seu pedido "${requestTitle}" no ConectaServ e gostaria de conversar.`
  );
  return `https://wa.me/${withCountry}?text=${msg}`;
};

const RequestCard = ({ request, userId, isGroupAdmin, onUpdate }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [newReply, setNewReply] = useState({ content: "", phone: "", providerId: "" });
  const [providerQuery, setProviderQuery] = useState("");
  const [providerOptions, setProviderOptions] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replies, setReplies] = useState(request.replies || []);
  const [resolved, setResolved] = useState(request.resolved || false);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (selectedProvider) return;
    if (!providerQuery || providerQuery.length < 2) {
      setProviderOptions([]);
      return;
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/providers/search?q=${encodeURIComponent(providerQuery)}`);
        setProviderOptions(res.data.providers || []);
      } catch {
        setProviderOptions([]);
      }
    }, 250);
    return () => clearTimeout(searchTimer.current);
  }, [providerQuery, selectedProvider]);

  const handlePickProvider = (p) => {
    setSelectedProvider(p);
    setNewReply((r) => ({ ...r, providerId: p.id }));
    setProviderQuery(p.user?.name || "");
    setShowSuggestions(false);
  };

  const clearProvider = () => {
    setSelectedProvider(null);
    setNewReply((r) => ({ ...r, providerId: "" }));
    setProviderQuery("");
    setProviderOptions([]);
  };

  const resetForm = () => {
    setNewReply({ content: "", phone: "", providerId: "" });
    setProviderQuery("");
    setProviderOptions([]);
    setSelectedProvider(null);
  };

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
    if (!newReply.content.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        content: newReply.content,
        phone: newReply.phone || undefined,
        providerId: newReply.providerId || undefined,
      };
      const res = await api.post(`/requests/${request.id}/replies`, payload);
      setReplies([...replies, res.data]);
      resetForm();
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
            {replies.map((r) => {
              const waLink = buildWhatsappLink(r.phone, request.title);
              return (
                <div key={r.id} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-medium shrink-0 mt-0.5">
                    {r.user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">
                      <span className="font-medium text-gray-700">{r.user?.name}</span>{" "}
                      <span className="text-gray-500">{r.content}</span>
                    </p>
                    {(r.provider || r.phone) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {r.provider && (
                          <Link
                            to={`/providers/${r.provider.id}`}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            {r.provider.user?.avatar ? (
                              <img
                                src={`${API_BASE}${r.provider.user.avatar}`}
                                alt=""
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            ) : null}
                            {r.provider.user?.name}
                            {r.provider.category && (
                              <span className="text-gray-400 capitalize">· {r.provider.category}</span>
                            )}
                          </Link>
                        )}
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 hover:underline"
                          >
                            <WhatsappIcon size={12} />
                            {r.phone}
                          </a>
                        )}
                      </div>
                    )}
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
              );
            })}
          </div>

          {/* Form responder (se nao resolvido) */}
          {!resolved && (
            <form onSubmit={handleReply} className="flex flex-col gap-2">
              <input
                type="text"
                value={newReply.content}
                onChange={(e) => setNewReply({ ...newReply, content: e.target.value })}
                placeholder="Escreva uma resposta..."
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="tel"
                  value={newReply.phone}
                  onChange={(e) => setNewReply({ ...newReply, phone: e.target.value })}
                  placeholder="Telefone (opcional)"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="flex-1 relative">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500">
                    <input
                      type="text"
                      value={providerQuery}
                      onChange={(e) => {
                        if (selectedProvider) clearProvider();
                        setProviderQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder="Indicar prestador cadastrado (opcional)"
                      className="flex-1 px-3 py-1.5 text-sm focus:outline-none"
                      disabled={!!selectedProvider}
                    />
                    {selectedProvider && (
                      <button
                        type="button"
                        onClick={clearProvider}
                        className="px-2 text-gray-400 hover:text-red-500"
                        title="Remover prestador"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {showSuggestions && providerOptions.length > 0 && !selectedProvider && (
                    <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-md max-h-48 overflow-auto">
                      {providerOptions.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handlePickProvider(p)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 flex items-center gap-2"
                          >
                            {p.user?.avatar ? (
                              <img src={`${API_BASE}${p.user.avatar}`} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                {p.user?.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            )}
                            <span className="font-medium text-gray-700">{p.user?.name}</span>
                            {p.category && (
                              <span className="text-xs text-gray-400 capitalize">{p.category}</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting || !newReply.content.trim()}
                  className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-40 shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestCard;
