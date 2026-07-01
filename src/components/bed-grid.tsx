'use client';

import React from 'react';
import { Bed as BedIcon, Check, ShieldAlert } from 'lucide-react';

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';
  currentResidentId?: string;
  expectedVacantDate?: string;
}

export interface Room {
  id: string;
  buildingId: string;
  floorNumber: number;
  roomNumber: string;
  sharingType: number;
  hasAC: boolean;
  hasWashroom: boolean;
  price: number;
  beds: Bed[];
}

interface BedGridProps {
  rooms: Room[];
  selectedBedId?: string;
  onSelectBed?: (bed: Bed, room: Room) => void;
  interactive?: boolean;
}

export default function BedGrid({ rooms, selectedBedId, onSelectBed, interactive = true }: BedGridProps) {
  // Group rooms by floor number
  const floors = rooms.reduce((acc: { [key: number]: Room[] }, room) => {
    acc[room.floorNumber] = acc[room.floorNumber] || [];
    acc[room.floorNumber].push(room);
    return acc;
  }, {});

  const floorKeys = Object.keys(floors)
    .map(Number)
    .sort((a, b) => a - b);

  if (rooms.length === 0) {
    return (
      <div className="p-8 text-center border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-500">No rooms or floors configured for this building.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs">
        <span className="text-zinc-500 font-medium">Availability Legend:</span>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500"></div>
          <span className="text-zinc-600 dark:text-zinc-400">Green: Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-amber-500/10 border border-amber-500"></div>
          <span className="text-zinc-600 dark:text-zinc-400">Yellow: Reserved (Pending approval)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-rose-500/10 border border-rose-500"></div>
          <span className="text-zinc-600 dark:text-zinc-400">Red: Occupied (Active resident)</span>
        </div>
      </div>

      {floorKeys.map((floorNum) => (
        <div key={floorNum} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Floor {floorNum}</span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {floors[floorNum].map((room) => (
              <div 
                key={room.id} 
                className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Room Header Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-base text-zinc-900 dark:text-white">Room {room.roomNumber}</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {room.sharingType} sharing • {room.hasAC ? 'AC' : 'Non-AC'} • {room.hasWashroom ? 'Private Bath' : 'Common Bath'}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-indigo-500">
                    ₹{room.price.toLocaleString('en-IN')}/mo
                  </span>
                </div>

                {/* Beds Grid layout resembling movie ticket selector */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-3">Live Bed Layout</span>
                  <div className="grid grid-cols-4 gap-3">
                    {room.beds.map((bed) => {
                      const isSelected = selectedBedId === bed.id;
                      let statusClasses = '';
                      
                      if (bed.status === 'AVAILABLE') {
                        statusClasses = isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 scale-105 shadow-md shadow-indigo-600/20'
                          : 'bg-emerald-500/5 text-emerald-600 border-emerald-500 hover:bg-emerald-500 hover:text-white cursor-pointer';
                      } else if (bed.status === 'RESERVED') {
                        statusClasses = 'bg-amber-500/5 text-amber-600 border-amber-500 cursor-not-allowed';
                      } else if (bed.status === 'OCCUPIED') {
                        statusClasses = 'bg-rose-500/5 text-rose-600 border-rose-500 cursor-not-allowed';
                      }

                      return (
                        <div
                          key={bed.id}
                          onClick={() => {
                            if (interactive && bed.status === 'AVAILABLE' && onSelectBed) {
                              onSelectBed(bed, room);
                            }
                          }}
                          title={`Bed ${bed.bedNumber} - ${bed.status}`}
                          className={`relative border rounded-lg p-2.5 flex flex-col items-center justify-center font-bold text-xs transition-all duration-200 select-none ${statusClasses}`}
                        >
                          <BedIcon className="w-4 h-4 mb-1" />
                          <span className="text-[10px] tracking-tight">{bed.bedNumber.split('-')[1] || bed.bedNumber}</span>
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 bg-white border border-indigo-600 rounded-full p-0.5 text-indigo-600 shadow">
                              <Check className="w-2.5 h-2.5 stroke-[4px]" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
