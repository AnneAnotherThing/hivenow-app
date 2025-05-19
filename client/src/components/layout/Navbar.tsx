import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Rows3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPath] = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-[#f9b81f] font-bold text-2xl flex items-center">
                <img src="/src/assets/bee-logo.png" alt="Hive-Now Logo" className="mr-2 h-8 w-8" />
                <span className="tracking-wide">Hive-Now</span>
              </Link>
            </div>
            <nav className="hidden md:ml-10 md:flex space-x-8">
              <Link href="/">
                <a className={`${currentPath === '/' ? 'text-gray-900' : 'text-gray-500'} hover:text-primary-500 px-3 py-2 rounded-md font-medium transition duration-150`}>
                  Home
                </a>
              </Link>
              <Link href="/#how-it-works">
                <a className="text-gray-500 hover:text-primary-500 px-3 py-2 rounded-md font-medium transition duration-150">
                  How it Works
                </a>
              </Link>
              <Link href="/subscriptions">
                <a className={`${currentPath === '/subscriptions' ? 'text-gray-900' : 'text-gray-500'} hover:text-primary-500 px-3 py-2 rounded-md font-medium transition duration-150`}>
                  Pricing
                </a>
              </Link>
              {user && (
                <Link href="/dashboard/projects">
                  <a className={`${currentPath === '/dashboard/projects' ? 'text-gray-900' : 'text-gray-500'} hover:text-primary-500 px-3 py-2 rounded-md font-medium transition duration-150`}>
                    Projects
                  </a>
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/submit-project">
                  <Button className="bg-[#0e47a1] hover:bg-[#0a3b82] text-white">Start a Project</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer">
                      <AvatarFallback>
                        {user.firstName && user.lastName
                          ? `${user.firstName[0]}${user.lastName[0]}`
                          : user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <a className="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150 mr-3">
                    Log in
                  </a>
                </Link>
                <Link href="/register">
                  <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150">
                    Sign up
                  </a>
                </Link>
              </>
            )}
            <button
              className="ml-4 md:hidden bg-white p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none"
              onClick={toggleMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link href="/">
                <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Home
                </a>
              </Link>
              <Link href="/#how-it-works">
                <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  How it Works
                </a>
              </Link>
              <Link href="/subscriptions">
                <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Pricing
                </a>
              </Link>
              {user && (
                <>
                  <Link href="/dashboard">
                    <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                      Dashboard
                    </a>
                  </Link>
                  <Link href="/submit-project">
                    <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                      Start a Project
                    </a>
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </>
              )}
              {!user && (
                <>
                  <Link href="/login">
                    <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                      Log in
                    </a>
                  </Link>
                  <Link href="/register">
                    <a className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:text-primary-800 hover:bg-gray-50">
                      Sign up
                    </a>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
