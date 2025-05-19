import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getProjects } from "@/lib/api";
import { MessageList } from "@/components/chat/MessageList";
import { useAuth } from "@/hooks/use-auth";
import { Project } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch all projects that the user is involved with
  const { data, isLoading } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: getProjects,
  });

  const projects = data?.projects || [];

  // Set the first project as active when data loads
  useEffect(() => {
    if (projects.length > 0 && !activeProject) {
      setActiveProject(projects[0]);
    }
  }, [projects, activeProject]);

  if (!user) return null;

  // Filter projects that have been assigned to a provider
  const projectsWithProviders = projects.filter(p => p.providerId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Communicate about your projects with service providers.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[600px] w-full" />
          </div>
        ) : projectsWithProviders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Projects</CardTitle>
                <CardDescription>Select a project to view messages</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="all" className="w-full">
                  <div className="px-6">
                    <TabsList className="w-full">
                      <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                      <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="all" className="mt-0">
                    <div className="divide-y">
                      {projectsWithProviders.map((project) => (
                        <button
                          key={project.id}
                          className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                            activeProject?.id === project.id ? "bg-gray-50" : ""
                          }`}
                          onClick={() => setActiveProject(project)}
                        >
                          <div className="font-medium text-sm">{project.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="active" className="mt-0">
                    <div className="divide-y">
                      {projectsWithProviders
                        .filter(p => p.status === "in_progress")
                        .map((project) => (
                          <button
                            key={project.id}
                            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                              activeProject?.id === project.id ? "bg-gray-50" : ""
                            }`}
                            onClick={() => setActiveProject(project)}
                          >
                            <div className="font-medium text-sm">{project.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(project.updatedAt).toLocaleDateString()}
                            </div>
                          </button>
                        ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              {activeProject ? (
                <MessageList project={activeProject} />
              ) : (
                <div className="p-6 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No project selected</h3>
                  <p className="text-muted-foreground max-w-md mt-2">
                    Select a project from the list to view messages
                  </p>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <CardTitle className="mb-2">No messages available</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              {user.role === "customer"
                ? "You don't have any projects with assigned service providers yet. Create a project to get started."
                : "You don't have any assigned projects yet. Check back later or reach out to your manager."}
            </CardDescription>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
