import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";
import { FileIcon, UsersIcon, CheckIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FaStar, FaStarHalf } from "react-icons/fa";

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'websites' | 'design' | 'content'>('websites');

  // Testimonials data
  const testimonials = [
    {
      id: 1,
      content: "ProjectPro exceeded my expectations. They understood exactly what I needed for my website redesign and delivered it on time. The communication was excellent throughout the process.",
      author: "Sarah Johnson",
      role: "Marketing Director",
      rating: 5,
      initials: "SJ"
    },
    {
      id: 2,
      content: "The monthly subscription is perfect for our ongoing content needs. The team is responsive and consistently delivers quality work. Would highly recommend for any business.",
      author: "David Chen",
      role: "Small Business Owner",
      rating: 4.5,
      initials: "DC"
    },
    {
      id: 3,
      content: "As a non-technical person, I was worried about communicating my needs, but the team made it so easy. They translated my basic ideas into a beautiful, functional app.",
      author: "Amanda Torres",
      role: "Startup Founder",
      rating: 5,
      initials: "AT"
    }
  ];

  // Render star ratings
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`star-${i}`} className="text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalf key="half-star" className="text-yellow-400" />);
    }

    return stars;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-16 pb-20 bg-gradient-to-br from-primary-500 to-accent-500 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 md:pr-12">
                <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">Get your projects completed by professionals</h1>
                <p className="text-lg sm:text-xl mb-8 text-white/90">Subscribe to our service and have your one-time or ongoing projects completed by vetted experts. Simple requirements, clear communication, guaranteed results.</p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link href={user ? "/submit-project" : "/register"}>
                    <Button size="lg" variant="secondary" className="bg-white text-primary-700 hover:bg-gray-50 shadow-lg hover:shadow-xl">
                      Start a Project
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                      How it Works
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2 mt-12 md:mt-0">
                <img 
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="Professional project consultation" 
                  className="rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How ProjectPro Works</h2>
              <p className="max-w-2xl mx-auto text-lg text-gray-600">A simple process to get your projects completed without the hassle.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-500 mb-6">
                  <FileIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. Submit Requirements</h3>
                <p className="text-gray-600">Tell us what you need in simple terms. No technical jargon required.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-500 mb-6">
                  <UsersIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. Get Matched</h3>
                <p className="text-gray-600">We'll assign the perfect professional for your specific project needs.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-500 mb-6">
                  <CheckIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. Project Delivery</h3>
                <p className="text-gray-600">Receive your completed project on time with continuous updates along the way.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Plans Section */}
        <section id="subscribe" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
              <p className="max-w-2xl mx-auto text-lg text-gray-600">Select the subscription that fits your project needs.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {SUBSCRIPTION_TIERS.map((tier) => (
                <div 
                  key={tier.id}
                  className={`bg-white rounded-lg shadow-lg overflow-hidden border ${tier.color} transition-transform duration-300 hover:transform hover:scale-105 ${tier.popularChoice ? 'transform scale-105 z-10 border-2' : ''}`}
                >
                  <div className={`p-6 ${tier.popularChoice ? 'bg-primary-500 text-white' : 'bg-gray-50 border-b border-gray-200'}`}>
                    {tier.popularChoice && (
                      <div className="inline-block px-3 py-1 rounded-full bg-white text-primary-500 text-xs font-semibold uppercase mb-3">Most Popular</div>
                    )}
                    <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
                    <p className={`${tier.popularChoice ? 'text-white/80' : 'text-gray-600'} mb-4`}>{tier.description}</p>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="ml-2">{tier.period}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-4">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckIcon className="h-5 w-5 text-green-500 mt-1 mr-2" />
                          <span dangerouslySetInnerHTML={{ __html: feature }}></span>
                        </li>
                      ))}
                    </ul>
                    <Link href={user ? "/subscriptions" : "/register"}>
                      <Button 
                        variant={tier.buttonVariant as any} 
                        className={`mt-8 w-full ${tier.popularChoice ? 'shadow-md' : ''}`}
                      >
                        Choose {tier.name}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
              <p className="max-w-2xl mx-auto text-lg text-gray-600">Read about the experience of our satisfied customers.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="border-gray-100">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-4">
                      <div className="text-yellow-400 flex">
                        {renderStars(testimonial.rating)}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{testimonial.rating}</span>
                    </div>
                    <blockquote className="text-gray-700 mb-6">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex items-center">
                      <Avatar>
                        <AvatarFallback>{testimonial.initials}</AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{testimonial.author}</p>
                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary-500">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to get started?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">Join thousands of satisfied customers who trust ProjectPro with their projects.</p>
            <Link href={user ? "/submit-project" : "/register"}>
              <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-50">
                {user ? "Submit Your Project" : "Sign Up Now"}
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
