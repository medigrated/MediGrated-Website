// client/src/pages/admin-view/dashboard.jsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  MessageSquare,
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle
} from "lucide-react";

function AdminDashboard() {
  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Reports",
      value: "89",
      change: "+5%",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Chat Sessions",
      value: "456",
      change: "+23%",
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "System Health",
      value: "98%",
      change: "+2%",
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ];

  const recentActivities = [
    { user: "Dr. Smith", action: "Generated report", time: "2 minutes ago", type: "report" },
    { user: "Patient John", action: "Started chat session", time: "5 minutes ago", type: "chat" },
    { user: "Admin", action: "Updated user permissions", time: "10 minutes ago", type: "admin" },
    { user: "Dr. Johnson", action: "Viewed patient data", time: "15 minutes ago", type: "view" }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Welcome back! Here's what's happening with your system.
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 shadow-medium hover:shadow-large transition-all duration-200">
          <TrendingUp className="h-4 w-4 mr-2" />
          View Analytics
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white/80 backdrop-blur-sm border-white/20 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-[1.02] animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-white/20 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activities
            </CardTitle>
            <CardDescription>
              Latest system activities and user interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-soft transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm">
                      {activity.user.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-gradient-secondary hover:opacity-90" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button className="w-full justify-start bg-gradient-accent hover:opacity-90" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button className="w-full justify-start bg-gradient-primary hover:opacity-90" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                View Chat Logs
              </Button>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Database Backup</p>
                  <p className="text-xs text-orange-600">Scheduled for tonight at 2 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Calendar className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">System Maintenance</p>
                  <p className="text-xs text-blue-600">Next Sunday 12 AM - 4 AM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
