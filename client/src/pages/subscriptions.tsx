import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getUserSubscription, createSubscription, cancelSubscription } from "@/lib/api";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckIcon, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";

// Import Stripe dependencies for payment
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

// Checkout Form Component
function CheckoutForm({ tier, onSuccess }: { tier: string, onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An error occurred during payment');
      toast({
        title: "Payment failed",
        description: error.message || "There was an issue processing your payment",
        variant: "destructive",
      });
    } else {
      // Payment succeeded
      toast({
        title: "Payment successful",
        description: `You are now subscribed to the ${tier} plan!`,
      });
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <PaymentElement />
      </div>
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Subscribe to ${tier}`
        )}
      </Button>
    </form>
  );
}

export default function Subscriptions() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch current subscription
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["/api/subscriptions"],
    queryFn: getUserSubscription,
    enabled: !!user,
  });

  const subscription = subscriptionData?.subscription;

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (tier: 'basic' | 'pro' | 'enterprise') => {
      // First, create/get subscription and get client secret
      const response = await createSubscription(tier);
      setClientSecret(response.clientSecret);
      return response;
    },
    onSuccess: () => {
      setIsPaymentDialogOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create subscription",
        description: error.message || "There was an error setting up your subscription",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription canceled",
        description: "Your subscription will remain active until the end of the current billing period",
      });
      setIsCancelDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cancel subscription",
        description: error.message || "There was an error canceling your subscription",
        variant: "destructive",
      });
    },
  });

  // Handle subscription selection
  const handleSelectTier = (tier: string) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setSelectedTier(tier);
    createSubscriptionMutation.mutate(tier as 'basic' | 'pro' | 'enterprise');
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
  };

  // Handle subscription cancellation
  const handleCancelSubscription = () => {
    cancelSubscriptionMutation.mutate();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-600">
              Select the subscription that fits your project needs.
            </p>
          </div>

          {subscription && (
            <div className="max-w-3xl mx-auto mb-16">
              <Card className="border-primary-500 border-2">
                <CardHeader className="bg-primary-50 border-b border-primary-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Your Current Subscription</h2>
                      <p className="text-gray-600 mt-1">
                        {`${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan`}
                      </p>
                    </div>
                    <Badge 
                      variant={subscription.status === 'active' ? "default" : "outline"}
                      className={subscription.status === 'active' ? "bg-green-500" : ""}
                    >
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Billing period:</span>
                      <span className="font-medium">
                        {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next billing date:</span>
                      <span className="font-medium">
                        {subscription.cancelAtPeriodEnd 
                          ? "Subscription will end on " + new Date(subscription.currentPeriodEnd).toLocaleDateString()
                          : new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                    {subscription.cancelAtPeriodEnd && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Subscription ending</AlertTitle>
                        <AlertDescription>
                          Your subscription has been canceled and will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-4 border-t border-gray-100 pt-6">
                  {!subscription.cancelAtPeriodEnd && (
                    <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">Cancel Subscription</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancel Subscription</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsCancelDialogOpen(false)}
                          >
                            Keep Subscription
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleCancelSubscription}
                            disabled={cancelSubscriptionMutation.isPending}
                          >
                            {cancelSubscriptionMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Canceling...
                              </>
                            ) : (
                              "Confirm Cancellation"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button>Manage Plan</Button>
                </CardFooter>
              </Card>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {SUBSCRIPTION_TIERS.map((tier) => (
              <div 
                key={tier.id}
                className={`rounded-lg shadow-lg overflow-hidden border ${tier.color} transition-transform duration-300 hover:transform hover:scale-105 ${tier.popularChoice ? 'transform scale-105 z-10 border-2 border-[#f9b81f]' : ''}`}
              >
                <div className={`p-6 ${tier.popularChoice ? 'bg-[#0e47a1] border-b-4 border-[#f9b81f]' : 'bg-gray-50 border-b border-gray-200'}`}>
                  {tier.popularChoice && (
                    <div className="inline-block px-3 py-1 rounded-full bg-[#f9b81f] text-black font-extrabold text-xs uppercase mb-3 shadow-md">Most Popular</div>
                  )}
                  <h3 className="text-2xl font-bold mb-1 text-white">{tier.name}</h3>
                  <p className="text-white mb-4">{tier.description}</p>
                  <div className="flex items-baseline">
                    <span className={`text-4xl font-bold ${tier.popularChoice ? 'text-white' : ''}`}>{tier.price}</span>
                    <span className={`ml-2 ${tier.popularChoice ? 'text-white' : ''}`}>{tier.period}</span>
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
                  <Button 
                    variant={tier.buttonVariant as any} 
                    className={`mt-8 w-full ${tier.popularChoice ? 'shadow-md' : ''}`}
                    onClick={() => handleSelectTier(tier.id)}
                    disabled={
                      createSubscriptionMutation.isPending || 
                      (subscription?.tier === tier.id && subscription?.status === 'active')
                    }
                  >
                    {createSubscriptionMutation.isPending && selectedTier === tier.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : subscription?.tier === tier.id ? (
                      "Current Plan"
                    ) : (
                      `Choose ${tier.name}`
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 max-w-3xl mx-auto text-center">
            <h3 className="text-xl font-bold mb-4">All plans include:</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <div className="rounded-full bg-primary-50 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <CheckIcon className="h-6 w-6 text-primary-500" />
                </div>
                <h4 className="font-semibold">Secure Payments</h4>
                <p className="text-gray-600 text-sm mt-2">All transactions are secure and encrypted</p>
              </div>
              <div className="p-4">
                <div className="rounded-full bg-primary-50 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <CheckIcon className="h-6 w-6 text-primary-500" />
                </div>
                <h4 className="font-semibold">Dedicated Support</h4>
                <p className="text-gray-600 text-sm mt-2">Get help whenever you need it</p>
              </div>
              <div className="p-4">
                <div className="rounded-full bg-primary-50 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <CheckIcon className="h-6 w-6 text-primary-500" />
                </div>
                <h4 className="font-semibold">Cancel Anytime</h4>
                <p className="text-gray-600 text-sm mt-2">No long-term contracts or commitments</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
            <DialogDescription>
              Enter your payment details to subscribe to the 
              {selectedTier && ` ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} `} 
              plan.
            </DialogDescription>
          </DialogHeader>
          
          {clientSecret ? (
            <Elements 
              stripe={stripePromise} 
              options={{ clientSecret, appearance: { theme: 'stripe' } }}
            >
              <CheckoutForm 
                tier={selectedTier || 'selected'} 
                onSuccess={handlePaymentSuccess} 
              />
            </Elements>
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
