import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Brain, Smartphone, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Travel Planning for{' '}
          <span className="text-primary">Every Generation</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          FlexiTrip uses AI to create travel plans that work for everyone in your family - 
          from energetic toddlers to wise grandparents. No more compromising on activities 
          or leaving anyone behind.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/chat">Start Planning Your Trip</Link>
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6">
            Learn More
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <Card>
          <CardHeader>
            <Users className="h-12 w-12 text-primary mb-4" />
            <CardTitle>Multi-Generational Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Built specifically for families with diverse age groups. 
              From 5-year-olds to 75-year-olds, we consider everyone&apos;s needs.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Brain className="h-12 w-12 text-primary mb-4" />
            <CardTitle>AI-Powered Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Smart suggestions that balance adventure for kids, 
              accessibility for seniors, and enjoyment for everyone in between.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Smartphone className="h-12 w-12 text-primary mb-4" />
            <CardTitle>Works Everywhere</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Progressive Web App that works on any device. 
              Install it like a native app or use it in your browser.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Shield className="h-12 w-12 text-primary mb-4" />
            <CardTitle>Privacy First</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              No account required. Your family information stays private 
              and is automatically cleaned up after 30 days.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-8">How FlexiTrip Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-semibold">Tell Us About Your Family</h3>
            <p className="text-muted-foreground">
              Use our integrated sidebar to add family members, set preferences, and 
              configure cultural settings - all while chatting naturally with our AI.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-xl font-semibold">Chat with AI Assistant</h3>
            <p className="text-muted-foreground">
              Describe your dream trip. Our AI understands your family&apos;s unique needs 
              and suggests perfect activities for everyone.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-xl font-semibold">Get Your Perfect Plan</h3>
            <p className="text-muted-foreground">
              Receive detailed recommendations with accessibility info, 
              timing suggestions, and alternatives for different energy levels.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary/5 rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Plan Your Next Adventure?</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Join families who&apos;ve discovered stress-free travel planning with FlexiTrip.
        </p>
        <Button asChild size="lg" className="text-lg px-8 py-6">
          <Link href="/chat">Start Your Free Trip Planning</Link>
        </Button>
      </div>
    </main>
  );
}