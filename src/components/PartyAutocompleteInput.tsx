import React, { useState, useEffect, useRef } from 'react';
import { History, X } from 'lucide-react';
import { searchPartyMemory, removePartyMemory } from '../lib/partyMemory';

interface PartyAutocompleteInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  partyType: 'from' | 'to';
  placeholder?: string;
  className?: string;
}

export const PartyAutocompleteInput: React.FC<PartyAutocompleteInputProps> = ({
  label,
  value,
  onChange,
  partyType,
  placeholder,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update suggestions whenever value changes
  useEffect(() => {
    // If empty or whitespace, do not show any suggestions (strict user requirement!)
    if (!value.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const matches = searchPartyMemory(partyType, value);
    setSuggestions(matches);
    setIsOpen(matches.length > 0);
  }, [value, partyType]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
  };

  const handleRemoveMemoryItem = (
    e: React.MouseEvent,
    suggestion: string
  ) => {
    e.stopPropagation();
    removePartyMemory(partyType, suggestion);
    const updated = searchPartyMemory(partyType, value);
    setSuggestions(updated);
    if (updated.length === 0) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (value.trim()) {
              const matches = searchPartyMemory(partyType, value);
              setSuggestions(matches);
              setIsOpen(matches.length > 0);
            }
          }}
          placeholder={placeholder}
          className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-600 focus:border-slate-400 dark:focus:border-slate-600 font-medium transition-all"
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
            title="Hapus isian"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Suggestions Dropdown (Only visible when user types initial and matches found) */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-1 duration-100">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <History className="w-3 h-3 text-slate-400" />
              <span>Saran dari Memori Transaksi</span>
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">Klik untuk memilih</span>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {suggestions.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                className="px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50/70 dark:hover:bg-slate-800 hover:text-blue-900 dark:hover:text-blue-400 cursor-pointer flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 group-hover:bg-blue-500 shrink-0" />
                  <span className="truncate">{item}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleRemoveMemoryItem(e, item)}
                  className="p-1 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 rounded opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  title="Hapus dari memori"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
