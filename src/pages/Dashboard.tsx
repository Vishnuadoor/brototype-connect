import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, LogOut, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Complaint {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  hub: string;
}

function DashboardContent() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, new: 0, inProgress: 0, resolved: 0 });

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
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

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      new: { variant: 'default', label: 'New' },
      acknowledged: { variant: 'secondary', label: 'Acknowledged' },
      in_progress: { variant: 'default', label: 'In Progress' },
      resolved: { variant: 'default', label: 'Resolved' },
      closed: { variant: 'secondary', label: 'Closed' },
    };

    const config = variants[status] || variants.new;
    return (
      <Badge variant={config.variant} className={`
        ${status === 'new' ? 'bg-status-new text-white' : ''}
        ${status === 'acknowledged' ? 'bg-status-acknowledged text-white' : ''}
        ${status === 'in_progress' ? 'bg-status-in-progress text-white' : ''}
        ${status === 'resolved' ? 'bg-status-resolved text-white' : ''}
        ${status === 'closed' ? 'bg-status-closed text-white' : ''}
      `}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-warning text-warning-foreground',
      high: 'bg-destructive text-destructive-foreground',
    };

    return (
      <Badge variant="outline" className={variants[priority]}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

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
          <h1 className="text-xl font-bold text-foreground">My Complaints</h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/submit')} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Complaint
            </Button>
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
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

        {/* Complaints List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Complaints</CardTitle>
            <CardDescription>
              Track the status of all your submitted complaints
            </CardDescription>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No complaints yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Submit your first complaint to get started
                </p>
                <Button onClick={() => navigate('/submit')} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Complaint
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    onClick={() => navigate(`/complaint/${complaint.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex-1">
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
                        <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
