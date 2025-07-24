// components/events/EventsCalendar.tsx - Calendar view for events
import React, { useState, useMemo } from 'react';

// Define interfaces locally
interface Event {
  $id: string;
  eventName: string;
  activityName?: string;
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
  organizerId: string;
  organizer?: { name: string; avatar?: string; };
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  inclusive?: string[];
  isPrivate?: boolean;
}

interface EventsCalendarProps {
  events: Event[];
  onEventSelect: (event: Event) => void;
}

const EventsCalendar: React.FC<EventsCalendarProps> = ({ events, onEventSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      const days = direction === 'prev' ? -7 : 7;
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      const days = direction === 'prev' ? -1 : 1;
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().split('T')[0];
      return eventDate === dateString;
    });
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      case 'expert': return 'bg-purple-500';
      default: return 'bg-emerald-500';
    }
  };

  // Generate calendar days for month view
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push({
        date: day,
        isCurrentMonth: day.getMonth() === month,
        isToday: day.toDateString() === new Date().toDateString(),
        events: getEventsForDate(day)
      });
    }
    
    return days;
  }, [currentDate, events]);

  // Generate week days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push({
        date: day,
        isToday: day.toDateString() === new Date().toDateString(),
        events: getEventsForDate(day)
      });
    }
    
    return days;
  }, [currentDate, events]);

  // Month view component
  const MonthView = () => (
    <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-slate-600">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="bg-gray-50 dark:bg-slate-700 px-2 py-3 text-center">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {day}
          </span>
        </div>
      ))}
      
      {/* Calendar days */}
      {monthDays.map((day, index) => (
        <div
          key={index}
          className={`
            bg-white dark:bg-slate-800 min-h-[120px] p-2 relative
            ${!day.isCurrentMonth ? 'opacity-40' : ''}
            ${day.isToday ? 'ring-2 ring-emerald-500' : ''}
          `}
        >
          <div className={`
            text-sm font-medium mb-1
            ${day.isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}
          `}>
            {day.date.getDate()}
          </div>
          
          {/* Events for this day */}
          <div className="space-y-1">
            {day.events.slice(0, 3).map((event, eventIndex) => (
              <button
                key={eventIndex}
                onClick={() => onEventSelect(event)}
                className={`
                  w-full text-left px-2 py-1 rounded text-xs text-white truncate
                  ${getDifficultyColor(event.difficulty)}
                  hover:opacity-80 transition-opacity
                `}
                title={`${event.eventName} - ${event.startTime || 'All day'}`}
              >
                {event.eventName}
              </button>
            ))}
            
            {day.events.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                +{day.events.length - 3} more
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Week view component
  const WeekView = () => (
    <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-slate-600">
      {weekDays.map((day, index) => (
        <div key={index} className="bg-white dark:bg-slate-800 min-h-[400px] p-3">
          <div className={`
            text-center mb-3 pb-2 border-b border-gray-200 dark:border-slate-600
            ${day.isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}
          `}>
            <div className="text-xs font-medium">
              {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={`
              text-lg font-bold mt-1
              ${day.isToday ? 'bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}
            `}>
              {day.date.getDate()}
            </div>
          </div>
          
          <div className="space-y-2">
            {day.events.map((event, eventIndex) => (
              <button
                key={eventIndex}
                onClick={() => onEventSelect(event)}
                className={`
                  w-full text-left p-2 rounded text-xs text-white
                  ${getDifficultyColor(event.difficulty)}
                  hover:opacity-80 transition-opacity
                `}
              >
                <div className="font-medium truncate">{event.eventName}</div>
                <div className="opacity-80 mt-1">
                  {event.startTime || 'All day'}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Day view component
  const DayView = () => {
    const todayEvents = getEventsForDate(currentDate);
    
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        
        {todayEvents.length > 0 ? (
          <div className="space-y-4">
            {todayEvents.map((event) => (
              <button
                key={event.$id}
                onClick={() => onEventSelect(event)}
                className="w-full text-left p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {event.eventName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {event.startTime || 'All day'}
                      {event.endTime && ` - ${event.endTime}`}
                    </p>
                    {event.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="ml-4 flex flex-col items-end space-y-2">
                    {event.difficulty && (
                      <span className={`
                        px-2 py-1 rounded-full text-xs text-white
                        ${getDifficultyColor(event.difficulty)}
                      `}>
                        {event.difficulty}
                      </span>
                    )}
                    
                    {event.currentParticipants !== undefined && event.maxParticipants && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {event.currentParticipants}/{event.maxParticipants} participants
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-gray-500 dark:text-gray-400">
              No events scheduled for this day
            </p>
          </div>
        )}
      </div>
    );
  };

  const navigate = (direction: 'prev' | 'next') => {
    switch (viewMode) {
      case 'month':
        navigateMonth(direction);
        break;
      case 'week':
        navigateWeek(direction);
        break;
      case 'day':
        navigateDay(direction);
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {viewMode === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {viewMode === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigate('prev')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
            >
              Today
            </button>
            
            <button
              onClick={() => navigate('next')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('month')}
            className={`
              px-3 py-1 rounded text-sm transition-colors
              ${viewMode === 'month'
                ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
              }
            `}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`
              px-3 py-1 rounded text-sm transition-colors
              ${viewMode === 'week'
                ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
              }
            `}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`
              px-3 py-1 rounded text-sm transition-colors
              ${viewMode === 'day'
                ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
              }
            `}
          >
            Day
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        {viewMode === 'month' && <MonthView />}
        {viewMode === 'week' && <WeekView />}
        {viewMode === 'day' && <DayView />}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Beginner</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Intermediate</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Advanced</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span>Expert</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-emerald-500 rounded"></div>
          <span>Other</span>
        </div>
      </div>

      {/* Events Summary */}
      {events.length > 0 && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-300">
          Showing {events.length} event{events.length !== 1 ? 's' : ''} 
          {viewMode === 'month' && ` in ${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
          {viewMode === 'week' && ` this week`}
          {viewMode === 'day' && ` today`}
        </div>
      )}
    </div>
  );
};

export default EventsCalendar;