import type { TimeSlot } from "@/types";

interface Props {
  slots: TimeSlot[];
  selected: string | null;
  onSelect: (slot: string) => void;
}

function formatTime(t: string): string {
  // "09:00:00" → "09:00"
  return t.slice(0, 5);
}

export default function TimeSlotPicker({ slots, selected, onSelect }: Props) {
  if (slots.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-4 text-center">
        No hay horarios disponibles para este día.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isSelected = selected === slot.start_time;
        return (
          <button
            key={slot.start_time}
            onClick={() => onSelect(slot.start_time)}
            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
              isSelected
                ? "bg-rose-500 text-white border-rose-500"
                : "bg-white text-gray-700 border-gray-200 hover:border-rose-400"
            }`}
          >
            {formatTime(slot.start_time)}
          </button>
        );
      })}
    </div>
  );
}
