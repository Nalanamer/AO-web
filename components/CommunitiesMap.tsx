import React, { useEffect, useRef, useState } from 'react';// Import the Community type from your communities page



interface Community {
  $id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  creatorId: string;
  admins: string[];
  members: string[];
  pendingMembers?: string[];
  activityTypes: string[];
  location?: {
    address: string;
    latitude: number;
    longitude: number;
    radius?: number;
  };
  avatar?: string;
  coverImage?: string;
  memberCount: number;
  activityCount?: number;
  eventCount?: number;
  upcomingEventCount?: number;
  isActive: boolean;
  settings: {
    autoApproveMembers: boolean;
    allowMemberEvents: boolean;
    allowMemberPosts: boolean;
    requireEventApproval: boolean;
  };
  createdAt: string;
  updatedAt?: string;
  hasLocationData?: boolean;
  distance?: number;
}

interface CommunitiesMapProps {
  communities: any[];
  onCommunitySelect: (communityId: string) => void;
  searchLocation?: { latitude: number; longitude: number } | null;
  searchRadius?: number;
}

const CommunitiesMap: React.FC<CommunitiesMapProps> = ({
  communities,
  onCommunitySelect,
  searchLocation,
  searchRadius = 25
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
    
const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
const [searchCircle, setSearchCircle] = useState<google.maps.Circle | null>(null);

  // Initialize map only once
useEffect(() => {
  if (!mapRef.current || !window.google || map) return;

  const center = searchLocation || { lat: -33.8688, lng: 151.2093 };
  const mapInstance = new window.google.maps.Map(mapRef.current, {
    center,
    zoom: 10,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });

  setMap(mapInstance);
}, []);

// Update markers and circle when data changes
// Update markers and circle when data changes
// Update markers and circle when data changes
useEffect(() => {
  if (!map) return;

  // Clear existing markers and circle immediately
  markers.forEach(marker => marker.setMap(null));
  if (searchCircle) {
    searchCircle.setMap(null);
    setSearchCircle(null);
  }

  // Add new community markers
  const newMarkers: google.maps.Marker[] = [];
  communities.forEach(community => {
    if (community.location) {
      const marker = new window.google.maps.Marker({
        position: { lat: community.location.latitude, lng: community.location.longitude },
        map: map,
        title: community.name
      });

      marker.addListener('click', () => onCommunitySelect(community.$id));
      newMarkers.push(marker);
    }
  });
  setMarkers(newMarkers);

  // Add search radius circle if location is set
  if (searchLocation) {
    const newCircle = new window.google.maps.Circle({
      center: { lat: searchLocation.latitude, lng: searchLocation.longitude },
      radius: searchRadius * 1000,
      map: map,
      fillColor: '#3B82F6',
      fillOpacity: 0.1,
      strokeColor: '#3B82F6',
      strokeOpacity: 0.5,
      strokeWeight: 2
    });
    setSearchCircle(newCircle);

    // Pan to search location
    map.panTo({ lat: searchLocation.latitude, lng: searchLocation.longitude });
  }
}, [map, communities, onCommunitySelect, searchLocation, searchRadius]);

return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default CommunitiesMap;