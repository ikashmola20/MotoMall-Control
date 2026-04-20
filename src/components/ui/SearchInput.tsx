'use client';

import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'بحث...' }: SearchInputProps) {
  return (
    <div className="flex items-center bg-bg-secondary rounded-xl px-3 py-2.5 border border-border focus-within:border-accent transition-colors">
      <Search className="w-4 h-4 text-text-muted ml-2" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full"
      />
    </div>
  );
}
