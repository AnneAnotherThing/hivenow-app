import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  FolderOpenIcon, 
  MessageSquare, 
  Calendar, 
  Settings, 
  LogOut 
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [currentPath] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, current: currentPath === "/dashboard" },
    { name: "Projects", href: "/dashboard/projects", icon: FolderOpenIcon, current: currentPath === "/dashboard/projects" },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare, current: currentPath === "/dashboard/messages" },
    { name: "Schedule", href: "/dashboard/schedule", icon: Calendar, current: currentPath === "/dashboard/schedule" },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, current: currentPath === "/dashboard/settings" },
  ];

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please log in to access the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-gray-800 overflow-y-auto">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
            <Link href="/">
              <a className="text-white font-bold text-xl flex items-center">
                <CheckboxMultipleLineIcon className="mr-2 h-6 w-6 text-white" />
                ProjectPro
              </a>
            </Link>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`${
                      item.current
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-300"
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                </Link>
              ))}
              <button
                onClick={logout}
                className="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left"
              >
                <LogOut
                  className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-300"
                  aria-hidden="true"
                />
                Logout
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between bg-gray-800 p-4 text-white">
        <Link href="/">
          <a className="font-bold text-xl flex items-center">
            <CheckboxMultipleLineIcon className="mr-2 h-6 w-6" />
            ProjectPro
          </a>
        </Link>
        <div className="flex space-x-4">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <a
                className={`${
                  item.current
                    ? "text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <item.icon className="h-6 w-6" />
              </a>
            </Link>
          ))}
          <button
            onClick={logout}
            className="text-gray-300 hover:text-white"
          >
            <LogOut className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function CheckboxMultipleLineIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
