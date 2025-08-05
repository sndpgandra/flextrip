'use client';

import { useState } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch?: (searchData: SearchData) => void;
  className?: string;
}

export interface SearchData {
  destination: string;
  checkIn: string;
  checkOut: string;
}

export default function SearchBar({ onSearch, className = '' }: SearchBarProps) {
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);

  const handleSearch = () => {
    onSearch?.({
      destination,
      checkIn,
      checkOut
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Main Search Bar */}
      <div className="flexitrip-search-bar">
        {/* Destination */}
        <div 
          className={`flex-1 px-3 cursor-pointer transition-all duration-200 rounded-full ${
            activeField === 'destination' ? 'bg-white shadow-lg' : 'hover:bg-gray-50'
          }`}
          onClick={() => setActiveField('destination')}
        >
          <div className="flex flex-col justify-center h-full py-2">
            <div className="text-xs font-semibold text-gray-900 leading-tight mb-0.5">Where</div>
            <input
              type="text"
              placeholder="Search destinations"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setActiveField('destination')}
              onBlur={() => setActiveField(null)}
              className="w-full text-xs text-gray-500 placeholder-gray-400 bg-transparent border-none outline-none leading-tight p-0 m-0"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200"></div>

        {/* Check In */}
        <div 
          className={`flex-1 px-3 cursor-pointer transition-all duration-200 rounded-full ${
            activeField === 'checkin' ? 'bg-white shadow-lg' : 'hover:bg-gray-50'
          }`}
          onClick={() => setActiveField('checkin')}
        >
          <div className="flex flex-col justify-center h-full py-2">
            <div className="text-xs font-semibold text-gray-900 leading-tight mb-0.5">trip start date</div>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              onFocus={() => setActiveField('checkin')}
              onBlur={() => setActiveField(null)}
              className="w-full text-xs text-gray-500 bg-transparent border-none outline-none leading-tight p-0 m-0"
              placeholder="Add dates"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200"></div>

        {/* Check Out */}
        <div 
          className={`flex-1 px-3 cursor-pointer transition-all duration-200 rounded-full ${
            activeField === 'checkout' ? 'bg-white shadow-lg' : 'hover:bg-gray-50'
          }`}
          onClick={() => setActiveField('checkout')}
        >
          <div className="flex flex-col justify-center h-full py-2">
            <div className="text-xs font-semibold text-gray-900 leading-tight mb-0.5">trip end date</div>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              onFocus={() => setActiveField('checkout')}
              onBlur={() => setActiveField(null)}
              className="w-full text-xs text-gray-500 bg-transparent border-none outline-none leading-tight p-0 m-0"
              placeholder="Add dates"
            />
          </div>
        </div>


        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="flexitrip-button-primary rounded-full h-10 w-10 p-0 m-1 flex-shrink-0"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center justify-center space-x-3 mt-2">
        <span className="text-xs text-gray-500">Popular:</span>
        <div className="flex space-x-1">
          {['Family-friendly', 'Beach', 'City breaks', 'Adventure'].map((filter) => (
            <button
              key={filter}
              onClick={() => setDestination(filter)}
              className="px-2 py-1 text-xs bg-[rgb(var(--background-blue-light))] hover:bg-[rgb(var(--primary-brand))] text-[rgb(var(--text-secondary))] hover:text-white rounded-full transition-colors duration-200 font-medium border border-[rgb(var(--border-light))] hover:border-[rgb(var(--primary-brand))]"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}