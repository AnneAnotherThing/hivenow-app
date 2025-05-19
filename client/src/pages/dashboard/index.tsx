import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { PlusCircle, FolderOpen, MessageSquare, StarIcon } from "lucide-react";
import { getProjects, getUserSubscription } from "@/lib/api";
import { Link } from "wouter";
import { PROJECT_STATUS } from "@/lib/constants";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch projects
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: getProjects,
  });

  // Fetch subscription
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["/api/subscriptions"],
    queryFn: getUserSubscription,
    enabled: user?.role === "customer",
  });

  const projects = projectsData?.projects || [];
  const subscription = subscriptionData?.subscription;

  // Count projects by status
  const projectCounts = {
    pending: projects.filter(project => project.status === 'pending').length,
    in_progress: projects.filter(project => project.status === 'in_progress').length,
    completed: projects.filter(project => project.status === 'completed').length,
  };

  // Get recent projects (up to 3)
  const recentProjects = [...projects].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 3);

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          {user.role === "customer" && (
            <Link href="/submit-project">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Projects</CardTitle>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <FolderOpen className="h-4 w-4 text-yellow-700" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{projectCounts.pending}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <FolderOpen className="h-4 w-4 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{projectCounts.in_progress}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <FolderOpen className="h-4 w-4 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{projectCounts.completed}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status (for customers) */}
        {user.role === "customer" && (
          <Card>
            <CardHeader>
              <CardTitle>Your Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSubscription ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              ) : subscription ? (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                      ${subscription.status === 'active' ? 'bg-green-100 text-green-800' : 
                      subscription.status === 'trial' ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                      {subscription.status}
                    </div>
                    <div className="text-sm font-medium capitalize">{subscription.tier} Plan</div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {subscription.cancelAtPeriodEnd 
                      ? `Your subscription will end on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}.` 
                      : `Your next billing date is ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}.`}
                  </p>
                  <div className="mt-4">
                    <Link href="/subscriptions">
                      <Button variant="outline" size="sm">Manage Subscription</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-4">You don't have an active subscription. Subscribe to start submitting projects.</p>
                  <Link href="/subscriptions">
                    <Button>View Plans</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Projects</CardTitle>
              <Link href="/dashboard/projects">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingProjects ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div 
                    key={project.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">{project.title}</h4>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PROJECT_STATUS[project.status].color}`}>
                        {PROJECT_STATUS[project.status].label}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {project.dueDate ? `Due: ${new Date(project.dueDate).toLocaleDateString()}` : 'No due date'}
                      </div>
                      <Link href={`/project/${project.id}`}>
                        <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-700">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="rounded-full w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
                <p className="text-gray-500 mb-4">
                  {user.role === "customer" 
                    ? "Start by creating your first project" 
                    : "No projects have been assigned to you yet"}
                </p>
                {user.role === "customer" && (
                  <Link href="/submit-project">
                    <Button>Create Project</Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
