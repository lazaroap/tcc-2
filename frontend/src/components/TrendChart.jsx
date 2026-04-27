const months = {
  "01": "Jan",
  "02": "Fev",
  "03": "Mar",
  "04": "Abr",
  "05": "Mai",
  "06": "Jun",
  "07": "Jul",
  "08": "Ago",
  "09": "Set",
  10: "Out",
  11: "Nov",
  12: "Dez",
};

const TrendChart = ({ trend }) => {
  if (!trend || trend.length === 0) return null;
  const max = 5;

  return (
    <div className="flex items-end gap-2 h-20 mt-2">
      {trend.map((item) => {
        const heightPct = Math.round((item.avg / max) * 100);
        const [, monthNum] = item.month.split("-");
        return (
          <div
            key={item.month}
            className="flex flex-col items-center gap-1 flex-1 min-w-0"
          >
            <span className="text-xs text-yellow-600 font-medium">
              {item.avg.toFixed(1)}
            </span>
            <div
              className="w-full bg-gray-100 rounded-t relative"
              style={{ height: "48px" }}
            >
              <div
                className="absolute bottom-0 w-full bg-yellow-400 rounded-t transition-all duration-500"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 truncate w-full text-center">
              {months[monthNum] || monthNum}
            </span>
            <span className="text-xs text-gray-300">{item.count}x</span>
          </div>
        );
      })}
    </div>
  );
};

export default TrendChart;
