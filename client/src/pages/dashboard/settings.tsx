import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Form validation schema
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  contactPreference: z.enum(["email", "phone", "slack", "discord", "other"]),
  contactValue: z.string().min(1, "Contact value is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      contactPreference: (user?.contactPreference as any) || "email",
      contactValue: user?.contactValue || "",
    }
  });

  // Update form when user data is loaded
  useEffect(() => {
    if (user) {
      form.setValue("firstName", user.firstName || "");
      form.setValue("lastName", user.lastName || "");
      form.setValue("contactPreference", (user.contactPreference as any) || "email");
      form.setValue("contactValue", user.contactValue || "");
    }
  }, [user, form]);

  // Update user settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("PATCH", "/api/users/settings", data);
    },
    onSuccess: (response) => {
      if (updateUser) {
        updateUser(response.data.user);
      }
      toast({
        title: "Settings Updated",
        description: "Your profile and notification preferences have been updated successfully.",
      });
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating your settings. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    await updateSettingsMutation.mutateAsync(data);
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and how you'd like to be contacted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {user.role === "provider" && (
                    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100 mb-6">
                      <h3 className="text-lg font-medium text-yellow-800 mb-3">Contact Preferences for Notifications</h3>
                      <p className="text-yellow-700 mb-4">
                        As a service provider, you'll receive notifications for new projects and messages. 
                        Select your preferred contact method to be notified immediately of any updates.
                      </p>
                      
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="contactPreference"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Contact Method</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select contact method" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="phone">Phone / SMS</SelectItem>
                                  <SelectItem value="slack">Slack</SelectItem>
                                  <SelectItem value="discord">Discord</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Choose how you want to be notified about new projects and updates.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="contactValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Details</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={
                                    form.watch("contactPreference") === "email" ? "your@email.com" :
                                    form.watch("contactPreference") === "phone" ? "+1 (555) 123-4567" :
                                    form.watch("contactPreference") === "slack" ? "@username or channel" :
                                    form.watch("contactPreference") === "discord" ? "username#1234" :
                                    "Contact information"
                                  } 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                {form.watch("contactPreference") === "email" && "We'll send project notifications to this email address."}
                                {form.watch("contactPreference") === "phone" && "We'll send SMS notifications to this phone number."}
                                {form.watch("contactPreference") === "slack" && "Enter your Slack username or channel."}
                                {form.watch("contactPreference") === "discord" && "Enter your Discord username with tag."}
                                {form.watch("contactPreference") === "other" && "Enter your preferred contact details."}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}