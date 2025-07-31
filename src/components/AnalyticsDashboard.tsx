import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, ScatterChart, Scatter
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Calendar, Clock, Building, Award, Users, Percent, Activity, BarChart3, Download, Filter, RefreshCw, Lightbulb, AlertCircle, CheckCircle2, ArrowUp, ArrowDown } from "lucide-react";
import moment from 'moment';

interface Application {
  id: string;
  companyName: string;
  position: string;
  status: 'To Submit' | 'Submitted' | 'Interviewing' | 'Offer Received' | 'Rejected';
  applicationDate: string;
  interviews?: Interview[];
  salary?: string;
  location?: string;
  deadline?: string;
}

interface Interview {
  id: string;
  type: 'Phone Screen' | 'Technical' | 'Behavioral' | 'Final Round' | 'HR' | 'Onsite' | 'Other';
  date: string;
  time: string;
  completed: boolean;
  outcome?: 'Passed' | 'Failed' | 'Pending';
}

interface AnalyticsDashboardProps {
  user: string;
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  orange: '#f97316'
};

const statusColors = {
  'To Submit': COLORS.warning,
  'Submitted': COLORS.primary,
  'Interviewing': COLORS.purple,
  'Offer Received': COLORS.success,
  'Rejected': COLORS.danger
};

export default function AnalyticsDashboard({ user }: AnalyticsDashboardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [timeRange, setTimeRange] = useState<'all' | '30' | '60' | '90'>('all');

  useEffect(() => {
    const savedApps = localStorage.getItem(`internaide_applications_${user}`);
    if (savedApps) {
      setApplications(JSON.parse(savedApps));
    }
  }, [user]);

  const filteredApplications = useMemo(() => {
    if (timeRange === 'all') return applications;
    
    const cutoffDate = moment().subtract(parseInt(timeRange), 'days');
    return applications.filter(app => 
      moment(app.applicationDate).isAfter(cutoffDate)
    );
  }, [applications, timeRange]);

  const statusData = useMemo(() => {
    const statusCounts = filteredApplications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: statusColors[status as keyof typeof statusColors]
    }));
  }, [filteredApplications]);

  const applicationTimelineData = useMemo(() => {
    const timelineMap = new Map<string, number>();
    
    filteredApplications.forEach(app => {
      const week = moment(app.applicationDate).startOf('week').format('MMM DD');
      timelineMap.set(week, (timelineMap.get(week) || 0) + 1);
    });

    return Array.from(timelineMap.entries())
      .map(([week, count]) => ({ week, applications: count }))
      .sort((a, b) => moment(a.week).valueOf() - moment(b.week).valueOf());
  }, [filteredApplications]);

  const successRateData = useMemo(() => {
    const total = filteredApplications.length;
    const submitted = filteredApplications.filter(app => app.status !== 'To Submit').length;
    const interviewing = filteredApplications.filter(app => app.status === 'Interviewing').length;
    const offers = filteredApplications.filter(app => app.status === 'Offer Received').length;
    const rejected = filteredApplications.filter(app => app.status === 'Rejected').length;

    return [
      { stage: 'Applications', count: total, rate: 100 },
      { stage: 'Submitted', count: submitted, rate: total > 0 ? (submitted / total) * 100 : 0 },
      { stage: 'Interviews', count: interviewing, rate: submitted > 0 ? (interviewing / submitted) * 100 : 0 },
      { stage: 'Offers', count: offers, rate: interviewing > 0 ? (offers / interviewing) * 100 : 0 }
    ];
  }, [filteredApplications]);

  const companyData = useMemo(() => {
    const companyCounts = filteredApplications.reduce((acc, app) => {
      acc[app.companyName] = (acc[app.companyName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(companyCounts)
      .map(([company, count]) => ({ company, applications: count }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10);
  }, [filteredApplications]);

  const interviewData = useMemo(() => {
    const interviewCounts: Record<string, number> = {};
    const interviewSuccess: Record<string, { total: number; passed: number }> = {};

    filteredApplications.forEach(app => {
      if (app.interviews) {
        app.interviews.forEach(interview => {
          interviewCounts[interview.type] = (interviewCounts[interview.type] || 0) + 1;
          
          if (!interviewSuccess[interview.type]) {
            interviewSuccess[interview.type] = { total: 0, passed: 0 };
          }
          
          if (interview.completed) {
            interviewSuccess[interview.type].total++;
            if (interview.outcome === 'Passed') {
              interviewSuccess[interview.type].passed++;
            }
          }
        });
      }
    });

    return Object.entries(interviewCounts).map(([type, count]) => ({
      type,
      count,
      successRate: interviewSuccess[type] 
        ? (interviewSuccess[type].passed / interviewSuccess[type].total) * 100 
        : 0
    }));
  }, [filteredApplications]);

  const responseTimes = useMemo(() => {
    const times: number[] = [];
    
    filteredApplications.forEach(app => {
      if (app.status !== 'To Submit' && app.status !== 'Submitted') {
        if (app.interviews && app.interviews.length > 0) {
          const firstInterview = app.interviews.sort((a, b) => 
            moment(`${a.date} ${a.time}`).valueOf() - moment(`${b.date} ${b.time}`).valueOf()
          )[0];
          
          const responseTime = moment(`${firstInterview.date} ${firstInterview.time}`)
            .diff(moment(app.applicationDate), 'days');
          
          if (responseTime > 0 && responseTime < 90) {
            times.push(responseTime);
          }
        }
      }
    });

    const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const min = times.length > 0 ? Math.min(...times) : 0;
    const max = times.length > 0 ? Math.max(...times) : 0;

    return { average: Math.round(avg), min, max, count: times.length };
  }, [filteredApplications]);

  const getKeyMetrics = () => {
    const total = filteredApplications.length;
    const submitted = filteredApplications.filter(app => app.status !== 'To Submit').length;
    const interviewing = filteredApplications.filter(app => app.status === 'Interviewing').length;
    const offers = filteredApplications.filter(app => app.status === 'Offer Received').length;
    const rejected = filteredApplications.filter(app => app.status === 'Rejected').length;

    const responseRate = submitted > 0 ? ((submitted - rejected) / submitted) * 100 : 0;
    const interviewRate = submitted > 0 ? (interviewing / submitted) * 100 : 0;
    const offerRate = interviewing > 0 ? (offers / interviewing) * 100 : 0;

    return {
      total,
      submitted,
      interviewing,
      offers,
      rejected,
      responseRate,
      interviewRate,
      offerRate
    };
  };

  const metrics = getKeyMetrics();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
              {entry.dataKey === 'rate' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  interface Insight {
    type: 'warning' | 'success' | 'info';
    title: string;
    message: string;
    action: string;
  }

  const getInsights = (): Insight[] => {
    const insights: Insight[] = [];
    
    if (metrics.responseRate < 10 && filteredApplications.length > 5) {
      insights.push({
        type: 'warning',
        title: 'Low Response Rate',
        message: 'Consider improving your application materials or targeting more suitable positions.',
        action: 'Review Applications'
      });
    }
    
    if (metrics.interviewRate > 20) {
      insights.push({
        type: 'success',
        title: 'Great Interview Rate!',
        message: 'Your applications are converting well to interviews. Keep it up!',
        action: 'View Interviews'
      });
    }
    
    if (responseTimes.average > 21) {
      insights.push({
        type: 'info',
        title: 'Response Time Pattern',
        message: 'Companies are taking longer to respond. Consider following up after 2 weeks.',
        action: 'Set Reminders'
      });
    }
    
    if (metrics.offerRate > 50 && metrics.offers > 0) {
      insights.push({
        type: 'success',
        title: 'Excellent Conversion!',
        message: 'You\'re converting interviews to offers very effectively.',
        action: 'Negotiate Offers'
      });
    }
    
    return insights;
  };

  const insights = getInsights();

  return (
    <div className="space-y-6">
      {/* Modern Analytics Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="text-lg text-white/90">
                Deep insights and metrics about your job application journey
              </p>
              <div className="flex items-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  {filteredApplications.length} Applications Analyzed
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {metrics.responseRate.toFixed(1)}% Response Rate
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  {metrics.offers} Offers Received
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary" 
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
                onClick={() => {
                  // Export functionality
                  const csvData = filteredApplications.map(app => ({
                    Company: app.companyName,
                    Position: app.position,
                    Status: app.status,
                    'Application Date': app.applicationDate,
                    Salary: app.salary || 'N/A',
                    Location: app.location || 'N/A'
                  }));
                  const csvContent = [Object.keys(csvData[0] || {}), ...csvData.map(row => Object.values(row))]
                    .map(row => row.map(field => `"${field}"`).join(','))
                    .join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `analytics-data-${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-40 bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="60">Last 60 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
      </div>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className={`p-4 rounded-xl border-l-4 bg-gradient-to-r shadow-sm ${
                insight.type === 'warning' 
                  ? 'border-l-amber-500 from-amber-50 to-amber-50/50 text-amber-900'
                  : insight.type === 'success'
                  ? 'border-l-green-500 from-green-50 to-green-50/50 text-green-900'
                  : 'border-l-blue-500 from-blue-50 to-blue-50/50 text-blue-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    insight.type === 'warning' 
                      ? 'bg-amber-100'
                      : insight.type === 'success'
                      ? 'bg-green-100'
                      : 'bg-blue-100'
                  }`}>
                    {insight.type === 'warning' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : insight.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Lightbulb className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{insight.title}</h4>
                    <p className="text-sm opacity-80">{insight.message}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-current/20 hover:bg-current/10"
                >
                  {insight.action}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Applications</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Activity className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{metrics.total}</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-blue-700">
                <span>Submitted</span>
                <span className="flex items-center gap-1">
                  {metrics.submitted > metrics.total * 0.8 ? (
                    <ArrowUp className="h-3 w-3 text-green-600" />
                  ) : null}
                  {metrics.submitted}
                </span>
              </div>
              <Progress 
                value={metrics.total > 0 ? (metrics.submitted / metrics.total) * 100 : 0} 
                className="h-1 bg-blue-200" 
              />
            </div>
            <p className="text-xs text-blue-600 mt-2">
              {metrics.submitted} submitted ({Math.round((metrics.submitted / (metrics.total || 1)) * 100)}%)
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Response Rate</CardTitle>
            <div className="p-2 bg-green-500 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{metrics.responseRate.toFixed(1)}%</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-green-700">
                <span>Industry Avg: ~15%</span>
                <span className="flex items-center gap-1">
                  {metrics.responseRate > 15 ? (
                    <ArrowUp className="h-3 w-3 text-green-600" />
                  ) : metrics.responseRate < 8 ? (
                    <ArrowDown className="h-3 w-3 text-red-600" />
                  ) : null}
                  {metrics.responseRate > 15 ? 'Above Avg' : metrics.responseRate < 8 ? 'Below Avg' : 'Average'}
                </span>
              </div>
              <Progress value={Math.min(metrics.responseRate * 5, 100)} className="h-1 bg-green-200" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              {metrics.submitted - metrics.rejected} positive responses
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Interview Rate</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{metrics.interviewRate.toFixed(1)}%</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-purple-700">
                <span>Target: 20%+</span>
                <span className="flex items-center gap-1">
                  {metrics.interviewRate > 20 ? (
                    <ArrowUp className="h-3 w-3 text-green-600" />
                  ) : metrics.interviewRate < 10 ? (
                    <ArrowDown className="h-3 w-3 text-red-600" />
                  ) : null}
                  {metrics.interviewRate > 20 ? 'Excellent' : metrics.interviewRate < 10 ? 'Needs Work' : 'Good'}
                </span>
              </div>
              <Progress value={Math.min(metrics.interviewRate * 3, 100)} className="h-1 bg-purple-200" />
            </div>
            <p className="text-xs text-purple-600 mt-2">
              {metrics.interviewing} active interviews
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Offer Rate</CardTitle>
            <div className="p-2 bg-orange-500 rounded-lg">
              <Award className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{metrics.offerRate.toFixed(1)}%</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-orange-700">
                <span>Target: 30%+</span>
                <span className="flex items-center gap-1">
                  {metrics.offerRate > 30 ? (
                    <ArrowUp className="h-3 w-3 text-green-600" />
                  ) : metrics.offerRate < 15 ? (
                    <ArrowDown className="h-3 w-3 text-red-600" />
                  ) : null}
                  {metrics.offerRate > 30 ? 'Great' : metrics.offerRate < 15 ? 'Improve' : 'Fair'}
                </span>
              </div>
              <Progress value={Math.min(metrics.offerRate * 2.5, 100)} className="h-1 bg-orange-200" />
            </div>
            <p className="text-xs text-orange-600 mt-2">
              {metrics.offers} offers received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Detailed Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Application Status Distribution */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Application Status
                </CardTitle>
                <CardDescription>Distribution of application statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={CustomTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {statusData.map((entry, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-xs"
                      style={{ borderColor: entry.color, color: entry.color }}
                    >
                      {entry.name}: {entry.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Success Funnel */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Application Funnel
                </CardTitle>
                <CardDescription>Success rates through each stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={successRateData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="stage" type="category" />
                      <Tooltip content={CustomTooltip} />
                      <Bar dataKey="rate" fill={COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Application Timeline */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Application Timeline
                </CardTitle>
                <CardDescription>Applications submitted over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={applicationTimelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip content={CustomTooltip} />
                      <Area 
                        type="monotone" 
                        dataKey="applications" 
                        stroke={COLORS.primary} 
                        fill={COLORS.primary}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Companies */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-purple-600" />
                  Top Companies
                </CardTitle>
                <CardDescription>Companies with most applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={companyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="company" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip content={CustomTooltip} />
                      <Bar dataKey="applications" fill={COLORS.purple} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Interview Performance */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-cyan-600" />
                  Interview Performance
                </CardTitle>
                <CardDescription>Interview types and success rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={interviewData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip content={CustomTooltip} />
                      <Bar yAxisId="left" dataKey="count" fill={COLORS.cyan} name="Count" />
                      <Bar yAxisId="right" dataKey="successRate" fill={COLORS.success} name="Success Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Response Time Stats */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Response Time Analysis
                </CardTitle>
                <CardDescription>Time between application and first response</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Average Response</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {responseTimes.average} days
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Range</span>
                      </div>
                      <div className="text-lg">
                        {responseTimes.min}-{responseTimes.max} days
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Based on {responseTimes.count} responses
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm">
                        <span>Fast (≤7 days)</span>
                        <span>Average (8-21 days)</span>
                        <span>Slow (≥22 days)</span>
                      </div>
                      <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />
                      </div>
                      <div className="mt-1 flex justify-center">
                        <div 
                          className="w-1 h-4 bg-primary rounded"
                          style={{
                            marginLeft: `${(responseTimes.average / 30) * 100}%`,
                            transform: 'translateX(-50%)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Key Performance Indicators */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-indigo-100/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <Activity className="h-5 w-5" />
                  Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-900">
                      {Math.round(
                        (metrics.responseRate + metrics.interviewRate + metrics.offerRate) / 3
                      )}%
                    </div>
                    <p className="text-sm text-indigo-700">Overall Performance</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Response Rate</span>
                      <span>{metrics.responseRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.responseRate} className="h-1" />
                    <div className="flex justify-between text-xs">
                      <span>Interview Rate</span>
                      <span>{metrics.interviewRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.interviewRate} className="h-1" />
                    <div className="flex justify-between text-xs">
                      <span>Offer Rate</span>
                      <span>{metrics.offerRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.offerRate} className="h-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Velocity */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <TrendingUp className="h-5 w-5" />
                  Application Velocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-900">
                      {timeRange === 'all' ? 
                        Math.round(filteredApplications.length / Math.max(moment().diff(moment(filteredApplications[0]?.applicationDate), 'weeks'), 1) || 0) :
                        Math.round(filteredApplications.length / (parseInt(timeRange) / 7))
                      }
                    </div>
                    <p className="text-sm text-green-700">Applications/Week</p>
                  </div>
                  <div className="text-xs text-green-600 text-center">
                    {filteredApplications.length > 0 ? (
                      timeRange === 'all' ? 
                        `Since ${moment(filteredApplications[filteredApplications.length - 1]?.applicationDate).format('MMM YYYY')}` :
                        `Last ${timeRange} days`
                    ) : 'No applications yet'}
                  </div>
                  <div className="flex justify-center">
                    <Badge 
                      variant="outline" 
                      className="border-green-300 text-green-700 bg-green-50"
                    >
                      {Math.round(filteredApplications.length / Math.max(parseInt(timeRange) / 7, 1)) > 5 ? 
                        'High Activity' : 
                        Math.round(filteredApplications.length / Math.max(parseInt(timeRange) / 7, 1)) > 2 ? 
                        'Moderate Activity' : 
                        'Low Activity'
                      }
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Trends */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Award className="h-5 w-5" />
                  Success Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <div className="text-xl font-bold text-purple-900">{metrics.offers}</div>
                      <div className="text-xs text-purple-700">Offers</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-900">{metrics.interviewing}</div>
                      <div className="text-xs text-purple-700">Interviewing</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Pipeline Health</span>
                      <span className="flex items-center gap-1">
                        {(metrics.interviewing + metrics.offers) > metrics.total * 0.3 ? (
                          <>
                            <ArrowUp className="h-3 w-3 text-green-600" />
                            Strong
                          </>
                        ) : (
                          <>
                            <ArrowDown className="h-3 w-3 text-orange-600" />
                            Needs Work
                          </>
                        )}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(((metrics.interviewing + metrics.offers) / Math.max(metrics.total, 1)) * 100, 100)} 
                      className="h-1" 
                    />
                  </div>
                  <div className="text-xs text-purple-600 text-center">
                    {metrics.total > 0 ? 
                      `${Math.round(((metrics.interviewing + metrics.offers) / metrics.total) * 100)}% active pipeline` :
                      'No active pipeline'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                Recommendations
              </CardTitle>
              <CardDescription>Personalized suggestions to improve your job search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {metrics.responseRate < 15 && (
                  <div className="p-4 rounded-lg bg-amber-50 border-l-4 border-amber-400">
                    <h4 className="font-semibold text-amber-900">Improve Application Quality</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Your response rate is below average. Consider tailoring your resume and cover letter for each position.
                    </p>
                  </div>
                )}
                {applicationTimelineData.length < 4 && (
                  <div className="p-4 rounded-lg bg-blue-50 border-l-4 border-blue-400">
                    <h4 className="font-semibold text-blue-900">Increase Application Frequency</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Apply to more positions regularly. Aim for 5-10 applications per week for better results.
                    </p>
                  </div>
                )}
                {metrics.interviewRate > 20 && metrics.offerRate < 20 && (
                  <div className="p-4 rounded-lg bg-purple-50 border-l-4 border-purple-400">
                    <h4 className="font-semibold text-purple-900">Focus on Interview Skills</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      You're getting interviews but not converting to offers. Practice mock interviews and research common questions.
                    </p>
                  </div>
                )}
                {responseTimes.average > 21 && (
                  <div className="p-4 rounded-lg bg-orange-50 border-l-4 border-orange-400">
                    <h4 className="font-semibold text-orange-900">Follow Up Strategy</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Companies are taking longer to respond. Set up follow-up reminders for 1-2 weeks after applying.
                    </p>
                  </div>
                )}
                {insights.length === 0 && (
                  <div className="col-span-2 text-center p-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h4 className="font-semibold text-green-900">Great Job!</h4>
                    <p className="text-sm text-green-700">
                      Your application strategy is performing well. Keep up the excellent work!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {filteredApplications.length === 0 && (
        <Card className="border-none shadow-sm">
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start adding applications to see analytics and insights
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}