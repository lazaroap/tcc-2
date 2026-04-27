export const barColors = [
  "bg-green-500",
  "bg-lime-400",
  "bg-yellow-400",
  "bg-orange-400",
  "bg-red-400",
];

const DistributionBar = ({ label, count, total, color }) => {
  const bar = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-6 text-right text-gray-500 font-medium shrink-0">
        {label}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${bar}%` }}
        />
      </div>
      <span className="w-16 text-right text-gray-400 text-xs shrink-0">
        {count} ({bar}%)
      </span>
    </div>
  );
};

export default DistributionBar;
