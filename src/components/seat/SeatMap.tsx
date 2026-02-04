import { useState } from 'react';
import { Seat } from '@/types/booking';
import { cn } from '@/lib/utils';

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: Seat[];
  maxSelectable: number;
  onSeatSelect: (seat: Seat) => void;
}

export function SeatMap({ seats, selectedSeats, maxSelectable, onSeatSelect }: SeatMapProps) {
  const rows = [...new Set(seats.map(s => s.row))];
  const columns = [...new Set(seats.map(s => s.column))];

  const getSeat = (row: number, column: string) => 
    seats.find(s => s.row === row && s.column === column);

  const isSelected = (seat: Seat) => 
    selectedSeats.some(s => s.id === seat.id);

  const canSelect = (seat: Seat) => 
    seat.isAvailable && (isSelected(seat) || selectedSeats.length < maxSelectable);

  const getSeatStyle = (seat: Seat) => {
    if (!seat.isAvailable) return 'bg-muted text-muted-foreground cursor-not-allowed';
    if (isSelected(seat)) return 'bg-primary text-primary-foreground';
    if (seat.type === 'premium') return 'bg-accent hover:bg-primary hover:text-primary-foreground';
    if (seat.type === 'exit-row') return 'bg-secondary hover:bg-primary hover:text-primary-foreground';
    return 'bg-background hover:bg-primary hover:text-primary-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 border-2 border-foreground bg-secondary">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-foreground bg-background" />
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-foreground bg-primary" />
          <span className="text-sm">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-foreground bg-muted" />
          <span className="text-sm">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-foreground bg-accent" />
          <span className="text-sm">Premium (+SAR 150)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-foreground bg-secondary" />
          <span className="text-sm">Exit Row (+SAR 80)</span>
        </div>
      </div>

      {/* Seat Map */}
      <div className="overflow-x-auto">
        <div className="min-w-max p-4 border-2 border-foreground bg-background">
          {/* Cockpit Indicator */}
          <div className="w-32 h-8 mx-auto mb-6 border-2 border-foreground bg-secondary flex items-center justify-center text-sm font-bold">
            COCKPIT
          </div>

          {/* Column Headers */}
          <div className="flex justify-center gap-1 mb-2">
            <div className="w-8" />
            {columns.map((col, idx) => (
              <div 
                key={col} 
                className={cn(
                  "w-10 text-center font-bold",
                  idx === 2 && "mr-6"
                )}
              >
                {col}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-1">
            {rows.map((row) => (
              <div key={row} className="flex justify-center gap-1 items-center">
                <div className="w-8 text-center text-sm font-mono">{row}</div>
                {columns.map((col, idx) => {
                  const seat = getSeat(row, col);
                  if (!seat) return <div key={`${row}${col}`} className="w-10 h-10" />;

                  return (
                    <button
                      key={seat.id}
                      disabled={!canSelect(seat)}
                      onClick={() => canSelect(seat) && onSeatSelect(seat)}
                      className={cn(
                        "w-10 h-10 border-2 border-foreground text-xs font-bold transition-colors",
                        getSeatStyle(seat),
                        idx === 2 && "mr-6",
                        !canSelect(seat) && "cursor-not-allowed"
                      )}
                      title={`${seat.id} - ${seat.type} ${seat.isAvailable ? `(+SAR ${seat.price})` : '(Occupied)'}`}
                    >
                      {seat.id}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tail Indicator */}
          <div className="w-24 h-6 mx-auto mt-6 border-2 border-foreground bg-secondary flex items-center justify-center text-xs font-bold">
            EXIT
          </div>
        </div>
      </div>

      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <div className="p-4 border-2 border-foreground bg-secondary">
          <h4 className="font-bold mb-2">Selected Seats:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedSeats.map((seat) => (
              <div 
                key={seat.id} 
                className="px-3 py-1 border-2 border-foreground bg-primary text-primary-foreground font-mono"
              >
                {seat.id} (+SAR {seat.price})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
