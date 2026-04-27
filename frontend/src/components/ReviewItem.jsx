import StarRating from "./StarRating";

const ReviewItem = ({ review, actions, showProvider, showGroup }) => {
  return (
    <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium text-sm shrink-0">
            {review.user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {review.user?.name}
            </p>
            <StarRating rating={review.rating} readonly size={14} />
          </div>
        </div>
        {showProvider && review.provider && (
          <a
            href={`/providers/${review.provider.id}`}
            className="text-right shrink-0"
          >
            <p className="text-xs text-blue-600 font-medium hover:underline">
              {review.provider.user?.name}
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {review.provider.category}
            </p>
          </a>
        )}
        {actions}
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 mt-2 ml-11">{review.comment}</p>
      )}
      <div className="flex items-center gap-3 mt-1 ml-11">
        {showGroup && review.group && (
          <span className="text-xs text-purple-500">
            via grupo: {review.group.name}
          </span>
        )}
        <span className="text-xs text-gray-300">
          {new Date(review.createdAt).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </div>
  );
};

export default ReviewItem;
