import { Link } from "react-router-dom";
import { Users } from "lucide-react";

const GroupCard = ({ group }) => {
  return (
    <Link
      to={`/groups/${group.id}`}
      state={{ groupPreview: group }}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
          <Users size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{group.name}</h3>
          {group.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {group.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>{group._count?.members || 0} membros</span>
            {group.owner && <span>por {group.owner.name}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GroupCard;
