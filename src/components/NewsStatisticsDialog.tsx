import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Heart, 
  Calendar, 
  TrendingUp, 
  Users, 
  BarChart3,
  Clock,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  DashboardDateFilter, 
  type DateFilterValue, 
  getDateRangeFromFilter 
} from '@/components/DashboardDateFilter';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface NewsArticle {
  id: string;
  title: string;
  created_at: string;
  published_at: string;
}

interface NewsStatisticsDialogProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NewsStats {
  total_views: number;
  total_likes: number;
  views_by_period: Array<{ period: string; views: number; likes: number }>;
  recent_activity: Array<{ 
    date: string; 
    views: number; 
    likes: number; 
    new_views: number;
    new_likes: number;
  }>;
}

export const NewsStatisticsDialog = ({ article, isOpen, onOpenChange }: NewsStatisticsDialogProps) => {
  const [stats, setStats] = useState<NewsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>('this_month');

  const fetchStats = async () => {
    if (!article) return;
    
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRangeFromFilter(dateFilter);
      
      // Get total views and likes for this article in the selected period
      const [viewsResult, likesResult] = await Promise.all([
        supabase
          .from('news_views')
          .select('id, created_at')
          .eq('news_id', article.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('news_likes')
          .select('id, created_at')
          .eq('news_id', article.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      ]);

      // Generate daily data for the period
      const dailyData = [];
      const daysBetween = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i < Math.min(daysBetween, 30); i++) {
        const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        
        const dayViews = viewsResult.data?.filter(view => {
          const viewDate = new Date(view.created_at);
          return viewDate >= currentDate && viewDate < nextDate;
        }).length || 0;
        
        const dayLikes = likesResult.data?.filter(like => {
          const likeDate = new Date(like.created_at);
          return likeDate >= currentDate && likeDate < nextDate;
        }).length || 0;

        dailyData.push({
          period: format(currentDate, 'dd MMM', { locale: id }),
          views: dayViews,
          likes: dayLikes,
          date: currentDate.toISOString()
        });
      }

      setStats({
        total_views: viewsResult.data?.length || 0,
        total_likes: likesResult.data?.length || 0,
        views_by_period: dailyData,
        recent_activity: dailyData.slice(-7)
      });
    } catch (error) {
      console.error('Error fetching news statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && article) {
      fetchStats();
    }
  }, [isOpen, article, dateFilter]);

  if (!article) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">📊 Statistik Artikel</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{article.title}</p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Filter */}
          <DashboardDateFilter 
            value={dateFilter} 
            onValueChange={setDateFilter}
            className="w-full"
          />

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Stats cards */}
          {stats && !loading && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_views}</div>
                    <p className="text-xs text-muted-foreground">
                      {getDateRangeFromFilter(dateFilter).label}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_likes}</div>
                    <p className="text-xs text-muted-foreground">
                      {getDateRangeFromFilter(dateFilter).label}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.total_views > 0 
                        ? ((stats.total_likes / stats.total_views) * 100).toFixed(1) 
                        : '0'
                      }%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Likes/Views ratio
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Daily Views</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.views_by_period.length > 0 
                        ? Math.round(stats.total_views / stats.views_by_period.length)
                        : 0
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per hari dalam periode
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Views chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Views Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        views: {
                          label: "Views",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-60"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.views_by_period}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="period" 
                            tick={{ fontSize: 12 }}
                            interval={Math.floor(stats.views_by_period.length / 5)}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area 
                            type="monotone" 
                            dataKey="views" 
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary) / 0.2)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Likes chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Likes Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        likes: {
                          label: "Likes",
                          color: "hsl(var(--secondary))",
                        },
                      }}
                      className="h-60"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.views_by_period}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="period" 
                            tick={{ fontSize: 12 }}
                            interval={Math.floor(stats.views_by_period.length / 5)}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line 
                            type="monotone" 
                            dataKey="likes" 
                            stroke="hsl(var(--secondary))" 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Article info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informasi Artikel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Dibuat:</span>
                      <span>{format(new Date(article.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                    </div>
                    {article.published_at && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Diterbitkan:</span>
                        <span>{format(new Date(article.published_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};