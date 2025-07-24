// components/events/EventsMap.tsx
import React, { useState } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import EventsGoogleMap from './EventsGoogleMap';

interface Event {
  $id: string;
  eventName?: string;
  title?: string;
  description?: string;
  date?: string;
  latitude?: number;
  longitude?: number;
}

interface EventsMapProps {
  events: any[]; // Use any[] for now to avoid conflicts
  onEventSelect: (event: any) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  searchLocation?: { latitude: number; longitude: number; address: string } | null;
  searchRadius?: number;
}

const EventsMap: React.FC<EventsMapProps> = ({ 
  events, 
  onEventSelect, 
  userLocation,
  searchLocation,
  searchRadius = 25
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🗺️ Events Map
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {events.length} events with location data
          </p>
        </div>
      </div>
      
      {/* Google Maps Container */}
      <div className="w-full h-96 rounded-lg border border-gray-200 dark:border-slate-600 relative overflow-hidden">
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
          <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
            <EventsGoogleMap
              events={events}
              onEventSelect={onEventSelect}
              userLocation={userLocation}
              searchLocation={searchLocation}
              searchRadius={searchRadius}
            />
          </Wrapper>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-700">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Google Maps API key required
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
              </p>
            </div>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 flex flex-col">
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mapZoomIn'));
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-t-lg"
            >
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <div className="border-t border-gray-200 dark:border-slate-600"></div>
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mapZoomOut'));
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-b-lg"
            >
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsMap;