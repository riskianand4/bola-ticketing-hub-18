import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, TrendingUp } from 'lucide-react';

export type DateFilterValue = 
  | 'today' 
  | 'yesterday' 
  | 'this_week' 
  | 'last_week' 
  | 'this_month' 
  | 'last_month' 
  | 'this_year' 
  | 'last_year' 
  | 'all_time';

interface DashboardDateFilterProps {
  value: DateFilterValue;
  onValueChange: (value: DateFilterValue) => void;
  className?: string;
}

export const DashboardDateFilter = ({ 
  value, 
  onValueChange, 
  className 
}: DashboardDateFilterProps) => {
  const filterOptions = [
    { value: 'today', label: '📅 Hari Ini', icon: '📅' },
    { value: 'yesterday', label: '📆 Kemarin', icon: '📆' },
    { value: 'this_week', label: '📊 Minggu Ini', icon: '📊' },
    { value: 'last_week', label: '📈 Minggu Lalu', icon: '📈' },
    { value: 'this_month', label: '📋 Bulan Ini', icon: '📋' },
    { value: 'last_month', label: '📉 Bulan Lalu', icon: '📉' },
    { value: 'this_year', label: '📊 Tahun Ini', icon: '📊' },
    { value: 'last_year', label: '📈 Tahun Lalu', icon: '📈' },
    { value: 'all_time', label: '🕐 Semua Waktu', icon: '🕐' },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        <span className="hidden sm:inline">Filter Periode:</span>
      </div>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Pilih periode" />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <span>{option.icon}</span>
                <span>{option.label.replace(/[📅📆📊📈📋📉🕐]\s/, '')}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Utility function to get date ranges based on filter
export const getDateRangeFromFilter = (filter: DateFilterValue) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case 'today':
      return {
        startDate: new Date(today),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        label: 'Hari Ini'
      };
      
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        startDate: yesterday,
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
        label: 'Kemarin'
      };
      
    case 'this_week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return {
        startDate: startOfWeek,
        endDate: endOfWeek,
        label: 'Minggu Ini'
      };
      
    case 'last_week':
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      lastWeekEnd.setHours(23, 59, 59, 999);
      return {
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
        label: 'Minggu Lalu'
      };
      
    case 'this_month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return {
        startDate: startOfMonth,
        endDate: endOfMonth,
        label: 'Bulan Ini'
      };
      
    case 'last_month':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      lastMonthEnd.setHours(23, 59, 59, 999);
      return {
        startDate: lastMonthStart,
        endDate: lastMonthEnd,
        label: 'Bulan Lalu'
      };
      
    case 'this_year':
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      endOfYear.setHours(23, 59, 59, 999);
      return {
        startDate: startOfYear,
        endDate: endOfYear,
        label: 'Tahun Ini'
      };
      
    case 'last_year':
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
      lastYearEnd.setHours(23, 59, 59, 999);
      return {
        startDate: lastYearStart,
        endDate: lastYearEnd,
        label: 'Tahun Lalu'
      };
      
    case 'all_time':
    default:
      return {
        startDate: new Date('2020-01-01'), // Far back date
        endDate: new Date(),
        label: 'Semua Waktu'
      };
  }
};

// Helper function to format period for chart data
export const getChartPeriodFromFilter = (filter: DateFilterValue) => {
  switch (filter) {
    case 'today':
    case 'yesterday':
      return { 
        type: 'hourly' as const, 
        count: 24, 
        unit: 'hour' as const 
      };
    case 'this_week':
    case 'last_week':
      return { 
        type: 'daily' as const, 
        count: 7, 
        unit: 'day' as const 
      };
    case 'this_month':
    case 'last_month':
      return { 
        type: 'daily' as const, 
        count: 31, 
        unit: 'day' as const 
      };
    case 'this_year':
    case 'last_year':
      return { 
        type: 'monthly' as const, 
        count: 12, 
        unit: 'month' as const 
      };
    case 'all_time':
    default:
      return { 
        type: 'yearly' as const, 
        count: 5, 
        unit: 'year' as const 
      };
  }
};