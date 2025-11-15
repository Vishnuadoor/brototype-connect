import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Search, Filter, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Complaint {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  hub: string;
  is_anonymous: boolean;
  user_id: string | null;
  manager_id: string | null;
  profiles?: {
    name: string;
  };
}

interface Profile {
  id: string;
  name: string;
  role: string;
}

function ManagerDashboardContent() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [stats, setStats] = useState({ total: 0, new: 0, inProgress: 0, resolved: 0 });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [hubFilter, setHubFilter] = useState('all');
  
  // Assignment dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    checkManagerAccess();
    fetchManagers();
  }, [user]);

  useEffect(() => {
    if (profile) {
      fetchComplaints();
    }
  }, [profile]);

  useEffect(() => {
    applyFilters();
  }, [complaints, searchQuery, statusFilter, priorityFilter, hubFilter]);

  const checkManagerAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data.role !== 'manager' && data.role !== 'admin') {
        toast.error('Access denied. Manager or admin role required.');
        navigate('/dashboard');
        return;
      }

      setProfile(data);
    } catch (error: any) {
      toast.error('Failed to verify access');
      navigate('/dashboard');
    }
  };

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('role', ['manager', 'admin']);

      if (error) throw error;
      setManagers(data || []);
    } catch (error: any) {
      console.error('Failed to load managers:', error);
    }
  };

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*, profiles!complaints_user_id_fkey(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComplaints(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const newCount = data?.filter(c => c.status === 'new').length || 0;
      const inProgress = data?.filter(c => c.status === 'in_progress' || c.status === 'acknowledged').length || 0;
      const resolved = data?.filter(c => c.status === 'resolved' || c.status === 'closed').length || 0;
      
      setStats({ total, new: newCount, inProgress, resolved });
    } catch (error: any) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...complaints];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.hub.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(c => c.priority === priorityFilter);
    }

    // Hub filter
    if (hubFilter !== 'all') {
      filtered = filtered.filter(c => c.hub === hubFilter);
    }

    setFilteredComplaints(filtered);
  };

  const updateComplaintStatus = async (complaintId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: newStatus as any })
        .eq('id', complaintId);

      if (error) throw error;

      toast.success('Status updated successfully');
      fetchComplaints();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const assignComplaint = async (complaintId: string, managerId: string | null) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ manager_id: managerId })
        .eq('id', complaintId);

      if (error) throw error;

      toast.success(managerId ? 'Complaint assigned successfully' : 'Assignment removed');
      setAssignDialogOpen(false);
      fetchComplaints();
    } catch (error: any) {
      toast.error('Failed to assign complaint');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      new: 'bg-status-new text-white',
      acknowledged: 'bg-status-acknowledged text-white',
      in_progress: 'bg-status-in-progress text-white',
      resolved: 'bg-status-resolved text-white',
      closed: 'bg-status-closed text-white',
    };

    return (
      <Badge className={config[status] || config.new}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, string> = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-warning text-warning-foreground',
      high: 'bg-destructive text-destructive-foreground',
    };

    return (
      <Badge className={config[priority]}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const uniqueHubs = [...new Set(complaints.map(c => c.hub))];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Manager Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {profile?.role === 'admin' ? 'Administrator' : 'Manager'} View
            </p>
          </div>
          <Button onClick={handleSignOut} variant="ghost" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
              <AlertCircle className="h-4 w-4 text-status-new" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-status-in-progress" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-status-resolved" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>

              <Select value={hubFilter} onValueChange={setHubFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Hubs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hubs</SelectItem>
                  {uniqueHubs.map(hub => (
                    <SelectItem key={hub} value={hub}>{hub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Complaints List */}
        <Card>
          <CardHeader>
            <CardTitle>All Complaints ({filteredComplaints.length})</CardTitle>
            <CardDescription>
              Manage and track all student complaints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/complaint/${complaint.id}`)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{complaint.title}</h3>
                        {getStatusBadge(complaint.status)}
                        {getPriorityBadge(complaint.priority)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="capitalize">{complaint.category.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{complaint.hub}</span>
                        <span>•</span>
                        <span>
                          {complaint.is_anonymous 
                            ? 'Anonymous' 
                            : complaint.profiles?.name || 'Unknown'}
                        </span>
                        <span>•</span>
                        <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Select
                      value={complaint.status}
                      onValueChange={(value) => updateComplaintStatus(complaint.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="acknowledged">Acknowledged</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setAssignDialogOpen(true);
                      }}
                    >
                      {complaint.manager_id ? 'Reassign' : 'Assign to Manager'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/complaint/${complaint.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}

              {filteredComplaints.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  No complaints match your filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Complaint</DialogTitle>
            <DialogDescription>
              Assign this complaint to a manager for handling
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              {managers.map((manager) => (
                <Button
                  key={manager.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => assignComplaint(selectedComplaint?.id || '', manager.id)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {manager.name} ({manager.role})
                </Button>
              ))}
              {selectedComplaint?.manager_id && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive"
                  onClick={() => assignComplaint(selectedComplaint?.id || '', null)}
                >
                  Remove Assignment
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ManagerDashboard() {
  return (
    <ProtectedRoute>
      <ManagerDashboardContent />
    </ProtectedRoute>
  );
}
