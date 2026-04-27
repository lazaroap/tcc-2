import { useState, useEffect } from "react";
import api from "../services/api";
import { Star } from "lucide-react";
import StarRating from "./StarRating";
import ReviewItem from "./ReviewItem";
import Pagination from "./Pagination";

const GroupReviewsTab = ({ groupId }) => {
  const [groupReviews, setGroupReviews] = useState([]);
  const [groupReviewPage, setGroupReviewPage] = useState(1);
  const [groupReviewPagination, setGroupReviewPagination] = useState(null);
  const [groupReviewStats, setGroupReviewStats] = useState({
    averageRating: null,
    reviewCount: 0,
  });
  const [groupReviewFilter, setGroupReviewFilter] = useState("");

  const fetchGroupReviews = async () => {
    try {
      const params = { page: groupReviewPage, limit: 10 };
      if (groupReviewFilter) params.rating = groupReviewFilter;
      const res = await api.get(`/groups/${groupId}/reviews`, { params });
      setGroupReviews(res.data.reviews || []);
      setGroupReviewStats({
        averageRating: res.data.averageRating,
        reviewCount: res.data.reviewCount,
      });
      setGroupReviewPagination(res.data.pagination || null);
    } catch (err) {
      console.error("Erro ao buscar avaliações do grupo:", err);
    }
  };

  useEffect(() => {
    fetchGroupReviews();
  }, [groupReviewPage, groupReviewFilter]);

  return (
    <div>
      {/* Cabecalho com media */}
      {groupReviewStats.reviewCount > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-800">
              {groupReviewStats.averageRating
                ? groupReviewStats.averageRating.toFixed(1)
                : "—"}
            </p>
            <StarRating
              rating={Math.round(groupReviewStats.averageRating || 0)}
              readonly
              size={14}
            />
            <p className="text-xs text-gray-400 mt-1">
              {groupReviewStats.reviewCount} avaliacoes
            </p>
          </div>
          <p className="text-sm text-gray-500 flex-1">
            Avaliações feitas por membros deste grupo
          </p>
        </div>
      )}

      {/* Filtro por nota */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-400">Filtrar por nota:</span>
        {["", "5", "4", "3", "2", "1"].map((val) => (
          <button
            key={val}
            onClick={() => {
              setGroupReviewFilter(val);
              setGroupReviewPage(1);
            }}
            className={`px-2.5 py-1 text-xs rounded-full border transition ${
              groupReviewFilter === val
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-200 text-gray-500 hover:border-blue-300"
            }`}
          >
            {val === "" ? "Todas" : `${val}★`}
          </button>
        ))}
      </div>

      {groupReviews.length === 0 ? (
        <div className="text-center py-12">
          <Star size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">
            Nenhuma avaliação feita neste grupo ainda.
          </p>
          <p className="text-gray-300 text-sm mt-1">
            Visite o perfil de um prestador para avaliar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <ReviewItem review={review} showProvider showGroup={false} />
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={groupReviewPage}
        totalPages={groupReviewPagination?.totalPages}
        onPageChange={setGroupReviewPage}
      />
    </div>
  );
};

export default GroupReviewsTab;
