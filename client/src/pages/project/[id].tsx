import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProject, updateProject, assignProject } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ProjectDetail } from "@/components/project/ProjectDetail";
import { MessageList } from "@/components/chat/MessageList";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ProjectPage() {
  const [match, params] = useRoute<{ id: string }>("/project/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAssigning, setIsAssigning] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch project details
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/projects/${params?.id}`],
    queryFn: () => getProject(Number(params?.id)),
    enabled: !!params?.id && !!user,
  });

  const project = data?.project;

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${params?.id}`] });
      toast({
        title: "Project updated",
        description: "The project has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update the project.",
        variant: "destructive",
      });
    },
  });

  // Assign project mutation (for providers)
  const assignProjectMutation = useMutation({
    mutationFn: (id: number) => assignProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${params?.id}`] });
      toast({
        title: "Project assigned",
        description: "You have been assigned to this project.",
      });
      setIsAssigning(false);
    },
    onError: (error: any) => {
      toast({
        title: "Assignment failed",
        description: error.message || "Failed to assign the project.",
        variant: "destructive",
      });
      setIsAssigning(false);
    },
  });

  // Handle project assignment
  const handleAssignProject = () => {
    if (!project) return;
    
    setIsAssigning(true);
    assignProjectMutation.mutate(project.id);
  };

  // Handle project status update
  const handleStatusUpdate = (status: string) => {
    if (!project) return;
    
    updateProjectMutation.mutate({
      id: project.id,
      data: { status },
    });
  };

  if (!user) return null;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <Link href="/dashboard/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Projects
                </Button>
              </Link>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Project</h2>
              <p className="text-gray-600 mb-4">There was an error loading the project details.</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/projects/${params?.id}`] })}>
                Try Again
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          ) : project ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">{project.title}</h1>

                {/* Provider Assignment Button */}
                {user.role === "provider" && !project.providerId && (
                  <Button 
                    onClick={handleAssignProject}
                    disabled={isAssigning}
                  >
                    {isAssigning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      "Take This Project"
                    )}
                  </Button>
                )}

                {/* Status Update Buttons (for provider or customer based on status) */}
                {(
                  (user.role === "provider" && project.providerId === user.id) || 
                  (user.role === "customer" && project.userId === user.id)
                ) && (
                  <div className="flex space-x-2">
                    {project.status === "pending" && user.role === "provider" && (
                      <Button onClick={() => handleStatusUpdate("in_progress")}>
                        Start Project
                      </Button>
                    )}
                    {project.status === "in_progress" && (
                      <Button 
                        onClick={() => handleStatusUpdate("completed")}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        Mark as Complete
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <Tabs defaultValue="details" className="w-full">
                <TabsList>
                  <TabsTrigger value="details">Project Details</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-6">
                  <ProjectDetail project={project} />
                </TabsContent>
                <TabsContent value="messages" className="mt-6">
                  {project.providerId ? (
                    <MessageList project={project} />
                  ) : (
                    <div className="bg-white p-8 rounded-lg shadow text-center">
                      <h3 className="text-xl font-medium mb-2">Waiting for a service provider</h3>
                      <p className="text-gray-600">
                        Messaging will be available once a service provider is assigned to this project.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h2 className="text-xl font-bold mb-2">Project Not Found</h2>
              <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have permission to view it.</p>
              <Link href="/dashboard/projects">
                <Button>View All Projects</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
