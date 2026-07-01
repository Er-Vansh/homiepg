import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  darkText?: boolean;
}

export function Logo({ className = "w-10 h-10", showText = true, darkText = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <svg 
        className={`${className} flex-shrink-0 transition-transform duration-200 hover:scale-105`} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* House Roof & Base - HomiePG Blue */}
        <path 
          d="M50 10 L12 42 H22 V85 H78 V42 H88 L50 10 Z" 
          fill="#0d55c8" 
        />
        {/* Shield Badge - HomiePG Green */}
        <path 
          d="M50 32 C62 32 70 42 70 54 C70 68 50 80 50 80 C50 80 30 68 30 54 C30 42 38 32 50 32 Z" 
          fill="#22c55e" 
        />
        {/* White Border Ring */}
        <circle cx="50" cy="53" r="15" fill="white" />
        {/* Inner Blue Circle */}
        <circle cx="50" cy="53" r="12" fill="#0d55c8" />
        {/* White letter 'H' */}
        <path 
          d="M46 47 V59 M54 47 V59 M46 53 H54" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
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
