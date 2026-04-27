import { Link } from "react-router-dom";
import StarRating from "./StarRating";

const ProviderCard = ({ provider }) => {
  return (
    <Link
      to={`/providers/${provider.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
          {provider.user?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">
            {provider.user?.name}
          </h3>
          <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full capitalize">
            {provider.category}
          </span>
          <div className="flex items-center gap-2 mt-2">
            <StarRating
              rating={Math.round(provider.averageRating || 0)}
              readonly
              size={16}
            />
            <span className="text-sm text-gray-500">
              {provider.averageRating
                ? `${provider.averageRating.toFixed(1)} (${provider.reviewCount})`
                : "Sem avaliações"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProviderCard;
