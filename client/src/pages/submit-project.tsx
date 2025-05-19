import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createProject, getUserSubscription } from "@/lib/api";
import { insertProjectSchema } from "@shared/schema";
import { PROJECT_TYPES } from "@/lib/constants";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Extend the project schema for form validation
const formSchema = insertProjectSchema.extend({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Please provide a detailed description of at least 20 characters" }),
  projectType: z.string().min(1, { message: "Please select a project type" }),
  attachments: z.any().optional(),
  subscriptionType: z.enum(["basic", "pro", "enterprise"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function SubmitProject() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  // Fetch user subscription
  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/subscriptions"],
    queryFn: getUserSubscription,
    enabled: !!user,
  });

  const subscription = subscriptionData?.subscription;

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      projectType: "",
      attachments: [],
      subscriptionType: subscription?.tier || "basic",
    },
  });

  // Update form values when subscription loads
  useEffect(() => {
    if (subscription) {
      form.setValue("subscriptionType", subscription.tier);
    }
  }, [subscription, form]);

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project submitted successfully",
        description: "Your project has been submitted and will be assigned to a professional soon.",
      });
      navigate("/dashboard/projects");
    },
    onError: (error: any) => {
      toast({
        title: "Project submission failed",
        description: error.message || "There was an error submitting your project. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  // Remove a file
  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      // In a real implementation, we would upload files to a server
      // For now, we'll just send file names as a demo
      const fileUrls = files.map(file => file.name);

      // Prepare project data
      const projectData = {
        title: data.title,
        description: data.description,
        attachments: fileUrls,
        tier: data.subscriptionType,
      };

      await createProjectMutation.mutateAsync(projectData);
    } catch (error) {
      console.error("Error submitting project:", error);
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Start Your Project</h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-600">Tell us what you need and we'll get it done.</p>
            <div className="mt-4 max-w-2xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Choose what works for you:</span> Complete a one-time project with no commitment, or explore our flexible subscription options. You're never locked in, and you can adjust your plan anytime.
                </p>
              </div>
            </div>
          </div>

          <Card className="border border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Provide information about your project requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., Website Redesign" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="projectType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select project type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROJECT_TYPES.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain your project in simple terms. Don't worry about technical details."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Be as specific as possible about what you need. This helps us match you with the right professional.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Attachments (optional)</FormLabel>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-500 hover:text-primary-400">
                            <span>Upload files</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              multiple
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, PDF, DOC up to 10MB</p>
                      </div>
                    </div>
                    {files.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Selected files:</h4>
                        <ul className="space-y-2">
                          {files.map((file, index) => (
                            <li key={index} className="text-sm flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span>{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="subscriptionType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Project Options</FormLabel>
                        <FormDescription>
                          Select the best option for your needs. No pressure - there's no long-term obligation with any choice!
                        </FormDescription>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 gap-4"
                          >
                            <FormItem className="relative">
                              <FormControl>
                                <RadioGroupItem value="basic" id="basic" className="sr-only peer" />
                              </FormControl>
                              <label 
                                htmlFor="basic"
                                className="block cursor-pointer p-4 border border-yellow-300 rounded-lg text-left peer-checked:border-yellow-500 peer-checked:bg-yellow-50 peer-checked:text-yellow-900"
                              >
                                <div className="text-lg font-medium mb-1">One-time Project</div>
                                <p className="text-sm text-gray-600">Perfect for simple, quick tasks that don't need ongoing support.</p>
                                <p className="text-sm text-yellow-600 mt-2">Or try us on for size - you can always upgrade later. We'll include this project in the upgrade!</p>
                              </label>
                            </FormItem>
                            
                            <FormItem className="relative">
                              <FormControl>
                                <RadioGroupItem value="pro" id="pro" className="sr-only peer" />
                              </FormControl>
                              <label 
                                htmlFor="pro"
                                className="block cursor-pointer p-4 border border-green-300 rounded-lg text-left peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-900"
                              >
                                <div className="text-lg font-medium mb-1">Book a First Time Consultation</div>
                                <p className="text-sm text-gray-600">Let's talk through your project needs and find the best approach for your specific situation.</p>
                              </label>
                            </FormItem>
                            
                            <FormItem className="relative">
                              <FormControl>
                                <RadioGroupItem value="enterprise" id="enterprise" className="sr-only peer" />
                              </FormControl>
                              <label 
                                htmlFor="enterprise"
                                className="block cursor-pointer p-4 border border-blue-300 rounded-lg text-left peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-900"
                              >
                                <div className="text-lg font-medium mb-1">Pay Later</div>
                                <p className="text-sm text-gray-600">My project is complicated and requires more conversation, maybe custom pricing.</p>
                              </label>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!subscription && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertTitle>Returning Customer?</AlertTitle>
                      <AlertDescription>
                        If you're a returning customer, you can <a href="/subscriptions" className="text-blue-600 hover:underline">view our subscription plans</a> for priority service and scheduled weekly meetings with your dedicated resource.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="mt-8">
                    <Button 
                      type="submit" 
                      className="w-full bg-primary-500 hover:bg-primary-600" 
                      disabled={isSubmitting}
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Project"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
