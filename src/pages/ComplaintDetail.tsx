import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Send } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  hub: string;
  room: string | null;
  is_anonymous: boolean;
  created_at: string;
  user_id: string | null;
}

interface Message {
  id: string;
  body: string;
  sender_id: string | null;
  created_at: string;
  profiles?: {
    name: string;
  };
}

function ComplaintDetailContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const fetchComplaintDetails = async () => {
    try {
      const { data: complaintData, error: complaintError } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', id)
        .single();

      if (complaintError) throw complaintError;
      setComplaint(complaintData);

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*, profiles(name)')
        .eq('complaint_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error: any) {
      toast.error('Failed to load complaint details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !complaint) return;
    
    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          complaint_id: complaint.id,
          sender_id: user?.id,
          body: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      await fetchComplaintDetails();
      toast.success('Message sent');
    } catch (error: any) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!complaint) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl p-4 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{complaint.title}</CardTitle>
                <CardDescription className="mt-2">
                  Submitted on {new Date(complaint.created_at).toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={`
                  ${complaint.status === 'new' ? 'bg-status-new' : ''}
                  ${complaint.status === 'acknowledged' ? 'bg-status-acknowledged' : ''}
                  ${complaint.status === 'in_progress' ? 'bg-status-in-progress' : ''}
                  ${complaint.status === 'resolved' ? 'bg-status-resolved' : ''}
                  ${complaint.status === 'closed' ? 'bg-status-closed' : ''}
                  text-white
                `}>
                  {complaint.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge className={`
                  ${complaint.priority === 'low' ? 'bg-muted text-muted-foreground' : ''}
                  ${complaint.priority === 'medium' ? 'bg-warning text-warning-foreground' : ''}
                  ${complaint.priority === 'high' ? 'bg-destructive text-destructive-foreground' : ''}
                `}>
                  {complaint.priority.toUpperCase()} PRIORITY
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p className="capitalize">{complaint.category.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p>{complaint.hub} {complaint.room ? `- ${complaint.room}` : ''}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
              <p className="text-sm whitespace-pre-wrap">{complaint.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Messages & Updates</CardTitle>
            <CardDescription>
              Communication thread for this complaint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation below.
                </p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className="text-xs font-medium mb-1">
                        {message.profiles?.name || 'Anonymous'}
                      </p>
                      <p className="text-sm">{message.body}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                size="icon"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function ComplaintDetail() {
  return (
    <ProtectedRoute>
      <ComplaintDetailContent />
    </ProtectedRoute>
  );
}
