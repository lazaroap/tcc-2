import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import StarRating from "../components/StarRating";
import ReviewItem from "../components/ReviewItem";
import Pagination from "../components/Pagination";
import DistributionBar, { barColors } from "../components/DistributionBar";
import TrendChart from "../components/TrendChart";
import {
  MessageSquare,
  Trash2,
  Edit3,
  BarChart2,
  TrendingUp,
} from "lucide-react";

const ProviderProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    averageRating: null,
    reviewCount: 0,
  });
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const fetchProvider = async () => {
    try {
      const res = await api.get(`/providers/${id}`);
      setProvider(res.data);
    } catch (error) {
      console.error("Erro ao buscar prestador:", error);
    }
  };

  const fetchReviews = async () => {
    try {
      const params = { page, limit: 10 };
      if (ratingFilter) params.rating = ratingFilter;
      const res = await api.get(`/providers/${id}/reviews`, { params });
      setReviews(res.data.reviews || []);
      setReviewStats({
        averageRating: res.data.averageRating,
        reviewCount: res.data.reviewCount,
      });
      setPagination(res.data.pagination || null);
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get(`/providers/${id}/stats`);
      setStats(res.data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProvider(), fetchReviews()]);
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!loading) fetchReviews();
  }, [page, ratingFilter]);

  useEffect(() => {
    if (showStats && !stats) fetchStats();
  }, [showStats]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Selecione uma nota");

    setSubmitting(true);
    try {
      if (editingReview) {
        await api.put(`/reviews/${editingReview.id}`, { rating, comment });
        toast.success("Avaliação atualizada!");
        setEditingReview(null);
      } else {
        await api.post(`/providers/${id}/reviews`, { rating, comment });
        toast.success("Avaliação enviada!");
      }
      setRating(0);
      setComment("");
      setStats(null);
      await Promise.all([fetchProvider(), fetchReviews()]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao enviar avaliação");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Deseja excluir esta avaliação?")) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success("Avaliação excluída!");
      setStats(null);
      await Promise.all([fetchProvider(), fetchReviews()]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao excluir");
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingReview(null);
    setRating(0);
    setComment("");
  };

  const isOwnProfile = provider?.userId === user?.id;
  const hasReviewed =
    reviews.some((r) => r.user?.id === user?.id) && !ratingFilter;

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Carregando...</div>;
  }

  if (!provider) {
    return (
      <div className="text-center py-20 text-gray-400">
        Prestador não encontrado
      </div>
    );
  }

  const avg = reviewStats.averageRating;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header do prestador */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl shrink-0">
            {provider.user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">
              {provider.user?.name}
            </h1>
            <span className="inline-block mt-1 px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full capitalize">
              {provider.category}
            </span>
            {provider.user?.phone && (
              <p className="text-sm text-gray-500 mt-1">
                {provider.user.phone}
              </p>
            )}
            {provider.bio && (
              <p className="text-gray-600 mt-3 text-sm">{provider.bio}</p>
            )}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <StarRating rating={Math.round(avg || 0)} readonly size={20} />
              <span className="text-sm text-gray-500">
                {avg
                  ? `${avg.toFixed(1)} de 5 (${reviewStats.reviewCount} ${reviewStats.reviewCount === 1 ? "avaliacao" : "avaliacoes"})`
                  : "Sem avaliacoes ainda"}
              </span>
              {!isOwnProfile && (
                <button
                  onClick={() => {
                    setShowStats(!showStats);
                  }}
                  className="ml-auto flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                >
                  <BarChart2 size={16} />
                  {showStats ? "Ocultar estatisticas" : "Ver estatisticas"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Painel de estatisticas */}
      {showStats && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-blue-500" />
            Estatisticas de avaliacao
          </h2>
          {loadingStats ? (
            <p className="text-sm text-gray-400">Carregando...</p>
          ) : stats ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Distribuição de notas
                </p>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star, i) => (
                    <DistributionBar
                      key={star}
                      label={star}
                      count={stats.distribution[star] || 0}
                      total={stats.reviewCount}
                      color={barColors[i]}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">
                      {stats.averageRating
                        ? stats.averageRating.toFixed(1)
                        : "—"}
                    </p>
                    <StarRating
                      rating={Math.round(stats.averageRating || 0)}
                      readonly
                      size={14}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {stats.reviewCount} avaliações
                    </p>
                  </div>
                  <div className="flex-1 border-l border-gray-100 pl-4 space-y-1">
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">
                        {stats.distribution[5] || 0}
                      </span>{" "}
                      excelentes (5 estrelas)
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">
                        {stats.distribution[4] || 0}
                      </span>{" "}
                      ótimas (4 estrelas)
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">
                        {(stats.distribution[1] || 0) +
                          (stats.distribution[2] || 0)}
                      </span>{" "}
                      negativas (1-2 estrelas)
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">
                        {stats.recommendationCount}
                      </span>{" "}
                      recomendações em grupos
                    </p>
                  </div>
                </div>
              </div>

              {stats.trend && stats.trend.length > 1 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <TrendingUp size={14} />
                    Tendência mensal (nota média)
                  </p>
                  <TrendChart trend={stats.trend} />
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {!isOwnProfile && (!hasReviewed || editingReview) && (
        <form
          onSubmit={handleSubmitReview}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {editingReview ? "Editar avaliação" : "Avaliar este prestador"}
          </h2>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Nota
            </label>
            <StarRating rating={rating} onChange={setRating} size={28} />
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Comentário (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi sua experiencia..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-60"
            >
              {submitting
                ? "Enviando..."
                : editingReview
                  ? "Atualizar avaliação"
                  : "Enviar avaliação"}
            </button>
            {editingReview && (
              <button
                type="button"
                onClick={cancelEdit}
                className="py-2.5 px-6 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <MessageSquare size={20} />
            Avaliações ({reviewStats.reviewCount})
          </h2>

          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">Filtrar:</span>
            {["", "5", "4", "3", "2", "1"].map((val) => (
              <button
                key={val}
                onClick={() => {
                  setRatingFilter(val);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs rounded-full border transition ${
                  ratingFilter === val
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-200 text-gray-500 hover:border-blue-300"
                }`}
              >
                {val === "" ? "Todas" : `${val}★`}
              </button>
            ))}
          </div>
        </div>

        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">
            {ratingFilter
              ? `Nenhuma avaliacao com ${ratingFilter} estrela(s).`
              : "Nenhuma avaliacao ainda."}
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                showGroup
                actions={
                  review.user?.id === user?.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditReview(review)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 transition"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : null
                }
              />
            ))}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={pagination?.totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default ProviderProfile;
