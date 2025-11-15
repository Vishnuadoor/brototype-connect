import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, FileText, Users, Shield, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover">
            <MessageSquare className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Brototype Complaints Hub
          </h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            A secure and efficient platform for Brototype students to raise and track complaints
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="group">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Easy Submission</CardTitle>
              <CardDescription>
                Submit complaints with detailed descriptions, attachments, and priority levels
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Real-time Tracking</CardTitle>
              <CardDescription>
                Track your complaints in real-time and communicate directly with managers
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Privacy Protected</CardTitle>
              <CardDescription>
                Option to submit complaints anonymously while maintaining accountability
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mx-auto mt-16 max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold">Create an Account</h3>
                <p className="text-muted-foreground">
                  Sign up with your email to get started
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold">Submit Your Complaint</h3>
                <p className="text-muted-foreground">
                  Provide details, upload photos, and set the priority level
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold">Track Progress</h3>
                <p className="text-muted-foreground">
                  Monitor status updates and communicate with managers through messaging
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <Card className="border-2 bg-card">
            <CardContent className="pt-6">
              <h2 className="mb-4 text-2xl font-bold">Ready to Get Started?</h2>
              <p className="mb-6 text-muted-foreground">
                Join Brototype Complaints Hub today and make your voice heard
              </p>
              <Button size="lg" onClick={() => navigate('/auth')}>
                Create Your Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
