import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  darkText?: boolean;
}

export function Logo({ className = "w-10 h-10", showText = true, darkText = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <img 
        src="/logo.svg" 
        alt="HomiePG Logo" 
        className={`${className} flex-shrink-0 transition-transform duration-200 hover:scale-105 object-contain`}
      />
      {showText && (
        <div className="flex flex-col select-none">
          <span className={`font-black text-xl leading-none tracking-tight ${darkText ? 'text-zinc-900 dark:text-white' : 'text-white'}`}>
            Homie<span className="text-emerald-500 dark:text-emerald-400">PG</span>
          </span>
          <span className="text-[8px] leading-normal text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest mt-0.5">
            Find Your Homie. Find Your Stay.
          </span>
        </div>
      )}
    </div>
  );
}
