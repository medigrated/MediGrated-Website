import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectFilteredActivities, deleteActivity } from '@/store/activitySlice';
import { formatActivityTime } from '@/lib/activityLogger';
import { Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ActivityFeed Component
 * Displays real-time activity log with filtering and pagination
 */
export function ActivityFeed({ limit = 10, showFilters = true }) {
  const dispatch = useDispatch();
  const activities = useSelector(selectFilteredActivities);
  const displayActivities = activities.slice(0, limit);

  const handleDeleteActivity = (id) => {
    dispatch(deleteActivity(id));
  };

  if (activities.length === 0) {
    return (
      <div className="
        bg-white dark:bg-slate-900
        rounded-lg p-6
        text-center text-gray-500 dark:text-gray-400
      ">
        <p>No activities yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity) => (
        <div
          key={activity.id}
          className="
            bg-white dark:bg-slate-900
            border border-gray-200 dark:border-slate-700
            rounded-lg p-4
            flex items-start justify-between
            hover:shadow-soft dark:hover:shadow-medium
            transition-all duration-200
          "
        >
          <div className="flex items-start gap-3 flex-1">
            <div className="text-2xl mt-1">{activity.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {activity.description}
              </p>
              {activity.details && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {activity.details}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  {activity.userRole}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {formatActivityTime(activity.timestamp)}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteActivity(activity.id)}
            className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

/**
 * ActivityStats Component
 * Shows summary statistics of activities
 */
export function ActivityStats() {
  const activities = useSelector(selectFilteredActivities);

  const stats = {
    total: activities.length,
    today: activities.filter((a) => {
      const date = new Date(a.timestamp);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }).length,
    thisWeek: activities.filter((a) => {
      const date = new Date(a.timestamp);
      const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return date > week;
    }).length,
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="
        bg-white dark:bg-slate-900
        border border-gray-200 dark:border-slate-700
        rounded-lg p-4 text-center
      ">
        <p className="text-2xl font-bold text-primary">{stats.total}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Activities</p>
      </div>
      <div className="
        bg-white dark:bg-slate-900
        border border-gray-200 dark:border-slate-700
        rounded-lg p-4 text-center
      ">
        <p className="text-2xl font-bold text-secondary">{stats.today}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Today</p>
      </div>
      <div className="
        bg-white dark:bg-slate-900
        border border-gray-200 dark:border-slate-700
        rounded-lg p-4 text-center
      ">
        <p className="text-2xl font-bold text-accent">{stats.thisWeek}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">This Week</p>
      </div>
    </div>
  );
}

/**
 * ActivityTimeline Component
 * Shows activities in a timeline format
 */
export function ActivityTimeline({ limit = 20 }) {
  const dispatch = useDispatch();
  const activities = useSelector(selectFilteredActivities);
  const displayActivities = activities.slice(0, limit);

  if (displayActivities.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No activities to display
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-primary"></div>
      <div className="space-y-6 ml-12">
        {displayActivities.map((activity) => (
          <div key={activity.id} className="relative">
            <div className="
              absolute left-0 top-1.5 w-6 h-6
              bg-white dark:bg-slate-900
              border-4 border-primary rounded-full
              flex items-center justify-center text-lg
            ">
              {activity.icon}
            </div>
            <div className="
              bg-white dark:bg-slate-900
              border border-gray-200 dark:border-slate-700
              rounded-lg p-4
            ">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {activity.description}
              </p>
              {activity.details && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {activity.details}
                </p>
              )}
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-gray-500 dark:text-gray-500">
                  {formatActivityTime(activity.timestamp)}
                </span>
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  {activity.userName}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
