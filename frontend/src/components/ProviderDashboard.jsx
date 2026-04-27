import { useState, useEffect } from "react";
import api from "../services/api";
import StarRating from "./StarRating";
import DistributionBar, { barColors } from "./DistributionBar";
import ReviewItem from "./ReviewItem";
import Pagination from "./Pagination";
import { Star, Users, BarChart2, MessageSquare } from "lucide-react";

const ProviderDashboard = ({ providerId }) => {
  const [providerStats, setProviderStats] = useState(null);
  const [providerReviews, setProviderReviews] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPagination, setReviewsPagination] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchProviderDashboard = async () => {
    setLoadingStats(true);
    try {
      const [statsRes, reviewsRes] = await Promise.all([
        api.get(`/providers/${providerId}/stats`),
        api.get(`/providers/${providerId}/reviews`, {
          params: { page: 1, limit: 5 },
        }),
      ]);
      setProviderStats(statsRes.data);
      setProviderReviews(reviewsRes.data.reviews || []);
      setReviewsPagination(reviewsRes.data.pagination || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchProviderReviews = async () => {
    try {
      const res = await api.get(`/providers/${providerId}/reviews`, {
        params: { page: reviewsPage, limit: 5 },
      });
      setProviderReviews(res.data.reviews || []);
      setReviewsPagination(res.data.pagination || null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProviderDashboard();
  }, [providerId]);

  useEffect(() => {
    if (reviewsPage > 1) fetchProviderReviews();
  }, [reviewsPage]);

  if (loadingStats) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Carregando estatisticas...
      </div>
    );
  }

  if (!providerStats) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">
            {providerStats.averageRating
              ? providerStats.averageRating.toFixed(1)
              : "—"}
          </p>
          <StarRating
            rating={Math.round(providerStats.averageRating || 0)}
            readonly
            size={14}
          />
          <p className="text-xs text-gray-400 mt-1">Nota media</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">
            {providerStats.reviewCount}
          </p>
          <div className="flex justify-center mt-1">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Avaliacoes</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">
            {providerStats.recommendationCount}
          </p>
          <div className="flex justify-center mt-1">
            <Users size={14} className="text-blue-400" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Recomendações</p>
        </div>
      </div>

      {providerStats.reviewCount > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-500" />
            Distribuição das notas
          </h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star, i) => (
              <DistributionBar
                key={star}
                label={star}
                count={providerStats.distribution[star] || 0}
                total={providerStats.reviewCount}
                color={barColors[i]}
              />
            ))}
          </div>
        </div>
      )}

      {providerReviews.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MessageSquare size={16} className="text-gray-500" />
            Avaliações recebidas
          </h3>
          <div className="space-y-4">
            {providerReviews.map((review) => (
              <ReviewItem key={review.id} review={review} showGroup />
            ))}
          </div>

          <Pagination
            page={reviewsPage}
            totalPages={reviewsPagination?.totalPages}
            onPageChange={setReviewsPage}
          />
        </div>
      )}

      {providerStats.reviewCount === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Star size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">
            Voce ainda não recebeu avaliações.
          </p>
          <p className="text-gray-300 text-xs mt-1">
            Compartilhe seu perfil para comecar a receber!
          </p>
        </div>
      )}
    </>
  );
};

export default ProviderDashboard;
