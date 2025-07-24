// types/index.ts - Complete TypeScript interfaces for AdventureOne web app

export interface User {
  $id: string;
  name?: string;
  email: string;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  searchRadius?: number;
  disciplines?: string[];
  emailVerification?: boolean;
  phoneVerification?: boolean;
  createdAt?: string;
  avatar?: string;
  bio?: string;
  stats?: {
    activitiesCreated: number;
    eventsHosted: number;
    eventsJoined: number;
  };
}

export interface Activity {
  $id: string;
  activityname: string;
  location: string | { 
    address: string; 
    latitude: number; 
    longitude: number; 
  };
  description?: string;
  types?: string[];
  eventCount?: number;
  participantCount?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isPrivate?: boolean;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  rating?: number;
  reviewCount?: number;
  externalUrls?: string[];
  inclusive?: string[];
  subTypes?: string[];
  typeSpecificData?: Record<string, any>;
}

export interface Event {
  $id: string;
  eventName: string;
  activityName?: string;
  activityId?: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string | { 
    address: string; 
    latitude: number; 
    longitude: number; 
  };
  description?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  participants?: Array<{ 
    userId: string; 
    joinedAt: string; 
    name?: string; 
  }>;
  organizerId: string;
  organizer?: {
    name: string;
    avatar?: string;
  };
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  inclusive?: string[];
  isPrivate?: boolean;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  requirements?: string[];
  equipment?: string[];
}

export interface FeedItem {
  $id: string;
  type: 'activity' | 'event';
  timestamp: string;
  // Include all properties from both Activity and Event
  activityname?: string;
  eventName?: string;
  location?: string | { 
    address: string; 
    latitude: number; 
    longitude: number; 
  };
  description?: string;
  types?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isPrivate?: boolean;
  userId?: string;
  organizerId?: string;
  createdAt?: string;
  startDate?: string;
  eventCount?: number;
  participantCount?: number;
  currentParticipants?: number;
  maxParticipants?: number;
  participants?: Array<{ 
    userId: string; 
    joinedAt: string; 
    name?: string; 
  }>;
  // Add any other properties that might be accessed
  [key: string]: any;
}

export interface Comment {
  $id: string;
  content: string;
  userId: string;
  user?: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt?: string;
  replies?: Comment[];
  parentId?: string;
}

export interface Notification {
  $id: string;
  type: 'event_invitation' | 'event_reminder' | 'activity_update' | 'comment' | 'like';
  title: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: string;
  data?: {
    activityId?: string;
    eventId?: string;
    commentId?: string;
    [key: string]: any;
  };
}

export interface Subscription {
  plan: 'free' | 'pro' | 'pro-plus';
  status: 'active' | 'inactive' | 'cancelled';
  currentPeriodEnd?: string;
  limits: {
    activities: number;
    events: number;
    participants: number;
    fileUploads: number;
  };
  usage: {
    activities: number;
    events: number;
    participants: number;
    fileUploads: number;
  };
}

export interface SearchFilters {
  query?: string;
  types?: string[];
  difficulty?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  location?: {
    address: string;
    radius: number;
  };
  maxParticipants?: number;
  inclusive?: string[];
  nearMe?: boolean;
}

export interface ActivityFilters extends SearchFilters {
  hasEvents?: boolean;
  privacy?: 'public' | 'private' | 'all';
}

export interface EventFilters extends SearchFilters {
  status?: 'upcoming' | 'ongoing' | 'completed' | 'all';
  availability?: 'available' | 'full' | 'all';
}

// Component prop types
export interface ActivityCardProps {
  activity: Activity;
  onPress?: () => void;
  user?: User | null;
  showActions?: boolean;
  compact?: boolean;
}

export interface EventCardProps {
  event: Event;
  onPress?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  user?: User | null;
  isGrid?: boolean;
  showActions?: boolean;
}

export interface UserStatsCardProps {
  user: User;
  stats?: {
    activitiesCreated: number;
    eventsHosted: number;
    eventsJoined: number;
    totalParticipants: number;
  };
}

// Hook return types
export interface UseActivitiesReturn {
  activities: Activity[];
  publicActivities: Activity[];
  loading: boolean;
  error: string | null;
  fetchActivities: () => Promise<void>;
  fetchPublicActivities: () => Promise<void>;
  searchActivities: (query: string, filters?: ActivityFilters) => Promise<void>;
  createActivity: (activity: Partial<Activity>) => Promise<Activity>;
  updateActivity: (id: string, activity: Partial<Activity>) => Promise<Activity>;
  deleteActivity: (id: string) => Promise<void>;
}

export interface UseEventsReturn {
  events: Event[];
  publicEvents: Event[];
  loading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  fetchPublicEvents: () => Promise<void>;
  searchEvents: (query: string, filters?: EventFilters) => Promise<void>;
  joinEvent: (eventId: string) => Promise<void>;
  leaveEvent: (eventId: string) => Promise<void>;
  createEvent: (event: Partial<Event>) => Promise<Event>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}