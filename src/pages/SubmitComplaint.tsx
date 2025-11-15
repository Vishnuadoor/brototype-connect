import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { z } from 'zod';

const complaintSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(2000, 'Description too long'),
  category: z.enum(['facilities', 'equipment', 'network', 'classroom', 'hygiene', 'safety', 'other']),
  hub: z.string().trim().min(2, 'Hub is required').max(100, 'Hub name too long'),
  room: z.string().trim().max(100, 'Room name too long').optional(),
  priority: z.enum(['low', 'medium', 'high']),
});

function SubmitComplaintContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file size (10MB max per file)
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      hub: formData.get('hub') as string,
      room: formData.get('room') as string || null,
      priority: formData.get('priority') as string,
    };

    try {
      complaintSchema.parse(data);

      // Insert complaint
      const complaintData: any = {
        title: data.title,
        description: data.description,
        category: data.category,
        hub: data.hub,
        room: data.room,
        priority: data.priority,
        user_id: isAnonymous ? null : user?.id,
        is_anonymous: isAnonymous,
      };

      const { data: complaint, error: complaintError } = await supabase
        .from('complaints')
        .insert(complaintData)
        .select()
        .single();

      if (complaintError) throw complaintError;

      // Upload files if any
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${complaint.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('complaint-attachments')
            .upload(fileName, file);

          if (!uploadError) {
            await supabase.from('attachments').insert({
              complaint_id: complaint.id,
              uploader_id: isAnonymous ? null : user?.id,
              file_path: fileName,
              file_name: file.name,
              mime_type: file.type,
              file_size: file.size,
            });
          }
        }
      }

      toast.success('Complaint submitted successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || 'Failed to submit complaint');
      }
    } finally {
      setIsLoading(false);
    }
  };

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

      <main className="container mx-auto max-w-2xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Submit New Complaint</CardTitle>
            <CardDescription>
              Provide detailed information about your complaint for faster resolution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="anonymous">Submit Anonymously</Label>
                  <p className="text-sm text-muted-foreground">
                    Your identity will not be visible to managers
                  </p>
                </div>
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Brief description of the issue"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select name="category" required disabled={isLoading}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facilities">Facilities</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="network">Network/WiFi</SelectItem>
                      <SelectItem value="classroom">Classroom</SelectItem>
                      <SelectItem value="hygiene">Hygiene</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select name="priority" required disabled={isLoading}>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hub">Hub *</Label>
                  <Input
                    id="hub"
                    name="hub"
                    placeholder="e.g., Kochi Hub"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room">Room (Optional)</Label>
                  <Input
                    id="room"
                    name="room"
                    placeholder="e.g., Lab 1"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide detailed information about the complaint..."
                  rows={6}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Attachments (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    disabled={isLoading || files.length >= 5}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isLoading || files.length >= 5}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {files.length}/5 files (max 10MB each)
                  </span>
                </div>
                {files.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between rounded-md border p-2">
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function SubmitComplaint() {
  return (
    <ProtectedRoute>
      <SubmitComplaintContent />
    </ProtectedRoute>
  );
}
