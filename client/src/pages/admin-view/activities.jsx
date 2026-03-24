import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ActivityFeed, ActivityStats, ActivityTimeline } from '@/components/shared/activity-feed';
import { setActivityFilter, resetActivityFilters, selectActivityFilters } from '@/store/activitySlice';
import { Activity, Grid3X3, List, RotateCcw } from 'lucide-react';

export default function ActivityLogs() {
  const dispatch = useDispatch();
  const filters = useSelector(selectActivityFilters);
  const [viewMode, setViewMode] = useState('feed'); // 'feed', 'timeline', 'stats'
  const [searchTerm, setSearchTerm] = useState('');

  const handleActivityTypeFilter = (type) => {
    dispatch(setActivityFilter({ type }));
  };

  const handleResetFilters = () => {
    dispatch(resetActivityFilters());
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Activity className="w-8 h-8" />
            Activity Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track all system activities and user actions in real-time
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Overview
        </h2>
        <ActivityStats />
      </div>

      {/* Filters and Controls */}
      <Card className="
        bg-white dark:bg-slate-900
        border-gray-200 dark:border-slate-700
        p-6
      ">
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Activities
            </label>
            <Input
              type="text"
              placeholder="Search by user, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quick Filters
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={filters.type === 'all' ? 'default' : 'outline'}
                onClick={() => handleActivityTypeFilter('all')}
              >
                All Activities
              </Button>
              <Button
                size="sm"
                variant={filters.type === 'LOGIN' ? 'default' : 'outline'}
                onClick={() => handleActivityTypeFilter('LOGIN')}
              >
                Logins
              </Button>
              <Button
                size="sm"
                variant={filters.type === 'PROFILE_UPDATE' ? 'default' : 'outline'}
                onClick={() => handleActivityTypeFilter('PROFILE_UPDATE')}
              >
                Profile Changes
              </Button>
              <Button
                size="sm"
                variant={filters.type === 'HEALTH_DATA_ADD' ? 'default' : 'outline'}
                onClick={() => handleActivityTypeFilter('HEALTH_DATA_ADD')}
              >
                Health Data
              </Button>
              <Button
                size="sm"
                variant={filters.type === 'PATIENT_ADD' ? 'default' : 'outline'}
                onClick={() => handleActivityTypeFilter('PATIENT_ADD')}
              >
                Patient Management
              </Button>
            </div>
          </div>

          {/* View Mode Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              View Mode
            </label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === 'feed' ? 'default' : 'outline'}
                onClick={() => setViewMode('feed')}
                className="gap-2"
              >
                <List className="w-4 h-4" />
                Feed View
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'timeline' ? 'default' : 'outline'}
                onClick={() => setViewMode('timeline')}
                className="gap-2"
              >
                <Activity className="w-4 h-4" />
                Timeline
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'stats' ? 'default' : 'outline'}
                onClick={() => setViewMode('stats')}
                className="gap-2"
              >
                <Grid3X3 className="w-4 h-4" />
                Statistics
              </Button>
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Activities Display */}
      <Card className="
        bg-white dark:bg-slate-900
        border-gray-200 dark:border-slate-700
        p-6
      ">
        {viewMode === 'feed' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Activity Feed
            </h2>
            <ActivityFeed limit={50} />
          </div>
        )}

        {viewMode === 'timeline' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Activity Timeline
            </h2>
            <ActivityTimeline limit={50} />
          </div>
        )}

        {viewMode === 'stats' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
              Activity Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Activity by Type */}
              <div className="p-4 bg-gradient-primary/10 dark:bg-gradient-primary/5 rounded-lg border border-primary/20">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Most Common Activities
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Profile Updates</span>
                    <span className="font-bold text-primary">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Logins</span>
                    <span className="font-bold text-primary">342</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Health Data Add</span>
                    <span className="font-bold text-primary">89</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Settings Changes</span>
                    <span className="font-bold text-primary">234</span>
                  </div>
                </div>
              </div>

              {/* Activity by User Role */}
              <div className="p-4 bg-gradient-secondary/10 dark:bg-gradient-secondary/5 rounded-lg border border-secondary/20">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Activities by Role
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Admin</span>
                    <span className="font-bold text-secondary">456</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Doctor</span>
                    <span className="font-bold text-secondary">678</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Patient</span>
                    <span className="font-bold text-secondary">934</span>
                  </div>
                </div>
              </div>

              {/* Time-based Stats */}
              <div className="p-4 bg-gradient-accent/10 dark:bg-gradient-accent/5 rounded-lg border border-accent/20">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Peak Activity Times
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Morning (6AM-12PM)</span>
                    <span className="font-bold text-accent">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Afternoon (12PM-6PM)</span>
                    <span className="font-bold text-accent">35%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Evening (6PM-12AM)</span>
                    <span className="font-bold text-accent">20%</span>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                  System Health
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Activities (24h)</span>
                    <span className="font-bold text-green-600 dark:text-green-400">2,068</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Avg per Hour</span>
                    <span className="font-bold text-green-600 dark:text-green-400">86</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">System Status</span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded font-bold">
                      Healthy
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Export Option */}
      <Card className="
        bg-white dark:bg-slate-900
        border-gray-200 dark:border-slate-700
        p-6 text-center
      ">
        <Button className="bg-primary hover:bg-primary/90 gap-2">
          📥 Export Activities Report
        </Button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Download activity logs as CSV or PDF for external analysis
        </p>
      </Card>
    </div>
  );
}
