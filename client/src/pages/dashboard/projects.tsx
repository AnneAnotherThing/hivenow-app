import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { PlusCircle, Eye, Clock, CalendarIcon } from "lucide-react";
import { Link } from "wouter";
import { getProjects } from "@/lib/api";
import { Project } from "@shared/schema";
import { PROJECT_STATUS } from "@/lib/constants";

export default function Projects() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch projects
  const { data, isLoading } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: getProjects,
  });

  useEffect(() => {
    if (data?.projects) {
      setProjects(data.projects);
    }
  }, [data]);

  // Define table columns
  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "title",
      header: "Project",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("title")}</div>
          <div className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof PROJECT_STATUS;
        return (
          <Badge variant="outline" className={PROJECT_STATUS[status].color}>
            {PROJECT_STATUS[status].label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString();
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const dueDate = row.getValue("dueDate");
        return dueDate ? new Date(dueDate as string).toLocaleDateString() : "No deadline";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Link href={`/project/${row.original.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          </Link>
        );
      },
    },
  ];

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          {user.role === "customer" && (
            <Link href="/submit-project">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : projects.length > 0 ? (
          <DataTable columns={columns} data={projects} searchKey="title" searchPlaceholder="Search projects..." />
        ) : (
          <div className="bg-white rounded-md border shadow-sm p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {user.role === "customer" 
                ? "You haven't created any projects yet. Start by submitting your first project."
                : "No projects have been assigned to you yet. Check back later."}
            </p>
            {user.role === "customer" && (
              <Link href="/submit-project">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Submit Project
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
