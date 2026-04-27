import { useState, useEffect } from "react";
import api from "../services/api";
import { Plus, Star } from "lucide-react";
import RecommendationCard from "./RecommendationCard";
import RecommendationForm from "./RecommendationForm";
import Pagination from "./Pagination";

const GroupRecommendationsTab = ({
  groupId,
  userId,
  isGroupAdmin,
  categories,
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [recPage, setRecPage] = useState(1);
  const [recPagination, setRecPagination] = useState(null);
  const [showRecForm, setShowRecForm] = useState(false);

  const fetchRecommendations = async () => {
    try {
      const res = await api.get(`/groups/${groupId}/recommendations`, {
        params: { page: recPage, limit: 10 },
      });
      setRecommendations(res.data.recommendations || []);
      setRecPagination(res.data.pagination || null);
    } catch (err) {
      console.error("Erro ao buscar recomendações:", err);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [recPage]);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowRecForm(!showRecForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
        >
          <Plus size={16} />
          Recomendar prestador
        </button>
      </div>

      {showRecForm && (
        <RecommendationForm
          groupId={groupId}
          categories={categories}
          onSuccess={() => {
            setShowRecForm(false);
            fetchRecommendations();
          }}
          onCancel={() => setShowRecForm(false)}
        />
      )}

      {recommendations.length === 0 ? (
        <div className="text-center py-12">
          <Star size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">Nenhuma recomendação ainda.</p>
          <p className="text-gray-300 text-sm mt-1">
            Seja o primeiro a recomendar um prestador!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              userId={userId}
              isGroupAdmin={isGroupAdmin}
              onUpdate={fetchRecommendations}
            />
          ))}
        </div>
      )}

      <Pagination
        page={recPage}
        totalPages={recPagination?.totalPages}
        onPageChange={setRecPage}
      />
    </div>
  );
};

export default GroupRecommendationsTab;
