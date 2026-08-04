const OPTION = "mb-1 flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border-[1.5px] px-2.5 text-[12.5px]";

// Lets the user switch between Google's alternative driving routes, each
// flagged with whether it uses tolls (approximate — see DirectionsRenderer).
export default function RouteOptions({ routes, selectedIndex, onSelect }) {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="my-2">
      {routes.map((r) => {
        const active = r.index === selectedIndex;
        return (
          <button
            key={r.index}
            onClick={() => onSelect(r.index)}
            className={active
              ? `${OPTION} border-forest bg-forest text-white`
              : `${OPTION} border-sand bg-chalk text-ink`}
          >
            <span className="min-w-0 truncate tabular-nums">
              Route {r.index + 1} · {r.duration} · {r.distance}
            </span>
            {r.hasTolls && (
              <span className={active
                ? "shrink-0 text-[11px] font-semibold text-white"
                : "shrink-0 text-[11px] font-semibold text-terracotta"}>
                tolls
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
