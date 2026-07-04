import { useState } from "react";
import { Link } from "react-router-dom";
import { ThumbsUp, ThumbsDown, MessageSquare, Trash2, Send } from "lucide-react";
import StarRating from "./StarRating";
import api from "../services/api";
import toast from "react-hot-toast";
import { hasEnoughReviews } from "../utils/rating";

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

const buildWhatsappLink = (rawPhone, contextTitle) => {
  const digits = (rawPhone || "").replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const msg = encodeURIComponent(
    `Olá! Vi a recomendação "${contextTitle}" no ConectaServ e gostaria de conversar.`
  );
  return `https://wa.me/${withCountry}?text=${msg}`;
};

const RecommendationCard = ({ rec, userId, isGroupAdmin, onUpdate, groupId }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleVote = async (type) => {
    try {
      if (rec.userVote === type) {
        await api.delete(`/recommendations/${rec.id}/vote`);
      } else {
        await api.post(`/recommendations/${rec.id}/vote`, { type });
      }
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao votar");
    }
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/recommendations/${rec.id}/comments`);
        setComments(res.data.comments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/recommendations/${rec.id}/comments`, {
        content: newComment,
      });
      setComments([...comments, res.data]);
      setNewComment("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao comentar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/recommendations/comments/${commentId}`);
      setComments(comments.filter((c) => c.id !== commentId));
      toast.success("Comentario excluido");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao excluir");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Excluir esta recomendacao?")) return;
    try {
      await api.delete(`/recommendations/${rec.id}`);
      toast.success("Recomendacao excluida");
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao excluir");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
            {rec.author?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{rec.author?.name}</p>
            <p className="text-xs text-gray-400">
              {new Date(rec.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        {(rec.authorId === userId || isGroupAdmin) && (
          <button onClick={handleDelete} className="p-1 text-gray-400 hover:text-red-500 transition">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Titulo e descricao */}
      <h3 className="font-semibold text-gray-800 mb-1">{rec.title}</h3>
      {rec.description && (
        <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
      )}

      {/* Provider card */}
      {rec.provider ? (
        <Link
          to={`/providers/${rec.provider.id}`}
          state={{ groupId }}
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition mb-3"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
            {rec.provider.user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">
              {rec.provider.user?.name}
            </p>
            <span className="text-xs text-blue-600 capitalize">{rec.provider.category}</span>
          </div>
          <div className="flex items-center gap-1">
            {hasEnoughReviews(rec.provider.reviewCount) ? (
              <>
                <StarRating
                  rating={Math.round(rec.provider.averageRating || 0)}
                  readonly
                  size={14}
                />
                <span className="text-xs text-gray-400">
                  {rec.provider.averageRating.toFixed(1)}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400">
                {rec.provider.reviewCount > 0 ? "Poucas avaliações" : "Novo"}
              </span>
            )}
          </div>
        </Link>
      ) : rec.externalName ? (
        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-dashed border-orange-200 mb-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
            {rec.externalName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{rec.externalName}</p>
            <div className="flex items-center gap-2">
              {rec.externalCategory && (
                <span className="text-xs text-orange-600 capitalize">{rec.externalCategory}</span>
              )}
              {rec.externalPhone && (() => {
                const waLink = buildWhatsappLink(rec.externalPhone, rec.title);
                return waLink ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 hover:underline"
                  >
                    <WhatsappIcon size={12} />
                    {rec.externalPhone}
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">{rec.externalPhone}</span>
                );
              })()}
            </div>
          </div>
          <span className="text-xs text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full font-medium shrink-0">Externo</span>
        </div>
      ) : null}

      {/* Acoes: votos e comentarios */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
        <button
          onClick={() => handleVote("UP")}
          className={`flex items-center gap-1 text-sm transition ${
            rec.userVote === "UP"
              ? "text-green-600 font-medium"
              : "text-gray-400 hover:text-green-500"
          }`}
        >
          <ThumbsUp size={16} />
          {rec.upvotes}
        </button>
        <button
          onClick={() => handleVote("DOWN")}
          className={`flex items-center gap-1 text-sm transition ${
            rec.userVote === "DOWN"
              ? "text-red-500 font-medium"
              : "text-gray-400 hover:text-red-400"
          }`}
        >
          <ThumbsDown size={16} />
          {rec.downvotes}
        </button>
        <button
          onClick={toggleComments}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-500 transition ml-auto"
        >
          <MessageSquare size={16} />
          {rec._count?.comments || 0}
        </button>
      </div>

      {/* Comentarios */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {loadingComments ? (
            <p className="text-xs text-gray-400">Carregando...</p>
          ) : (
            <>
              {comments.length === 0 && (
                <p className="text-xs text-gray-400 mb-2">Nenhum comentario ainda.</p>
              )}
              <div className="space-y-2 mb-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-medium shrink-0 mt-0.5">
                      {c.user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-medium text-gray-700">{c.user?.name}</span>{" "}
                        <span className="text-gray-500">{c.content}</span>
                      </p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {(c.userId === userId || isGroupAdmin) && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentario..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;
