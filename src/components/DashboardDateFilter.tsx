import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from 'lucide-react';

export type DateFilterValue = 
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
    { value: 'this_month', label: 'Bulan Ini' },
    { value: 'last_month', label: 'Bulan Lalu' },
    { value: 'this_year', label: 'Tahun Ini' },
    { value: 'last_year', label: 'Tahun Lalu' },
    { value: 'all_time', label: 'Semua Data' },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Periode:</span>
      </div>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Pilih periode" />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
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
        label: 'Semua Data'
      };
  }
};

// Helper function to format period for chart data
export const getChartPeriodFromFilter = (filter: DateFilterValue) => {
  switch (filter) {
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