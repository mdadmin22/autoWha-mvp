import type { Service } from "@/types";

interface Props {
  service: Service;
  selected?: boolean;
  onClick?: () => void;
}

export default function ServiceCard({ service, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected
          ? "border-rose-500 bg-rose-50"
          : "border-gray-200 bg-white hover:border-rose-300"
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-semibold text-gray-900">{service.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {service.duration_minutes} min
          </p>
        </div>
        {service.price != null && (
          <span className="text-rose-600 font-bold whitespace-nowrap">
            ${service.price.toLocaleString("es-AR")}
          </span>
        )}
      </div>
    </button>
  );
}
