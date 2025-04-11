
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Home, Users, Calendar, FileSpreadsheet, 
  Settings, User, BookOpen, ClipboardList, 
  BarChart4, LogOut, Menu, X 
} from "lucide-react";

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  if (!user) return null;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Define navigation links based on user role
  const getNavLinks = () => {
    const commonLinks = [
      { to: "/dashboard", icon: <Home className="h-5 w-5" />, text: "Dashboard" },
      { to: "/profile", icon: <User className="h-5 w-5" />, text: "Profile" },
    ];

    const roleSpecificLinks = {
      admin: [
        { to: "/users", icon: <Users className="h-5 w-5" />, text: "User Management" },
        { to: "/data-sync", icon: <FileSpreadsheet className="h-5 w-5" />, text: "Data Sync" },
        { to: "/settings", icon: <Settings className="h-5 w-5" />, text: "System Settings" },
      ],
      departmentHead: [
        { to: "/topics", icon: <BookOpen className="h-5 w-5" />, text: "PFE Topics" },
        { to: "/juries", icon: <Users className="h-5 w-5" />, text: "Jury Assignment" },
        { to: "/schedule", icon: <Calendar className="h-5 w-5" />, text: "Schedule" },
        { to: "/participation", icon: <ClipboardList className="h-5 w-5" />, text: "Participation" },
        { to: "/reports", icon: <BarChart4 className="h-5 w-5" />, text: "Reports" },
      ],
      teacher: [
        { to: "/presentations", icon: <BookOpen className="h-5 w-5" />, text: "My Presentations" },
        { to: "/availability", icon: <Calendar className="h-5 w-5" />, text: "Availability" },
        { to: "/participation", icon: <ClipboardList className="h-5 w-5" />, text: "Participation" },
      ],
      student: [
        { to: "/my-topic", icon: <BookOpen className="h-5 w-5" />, text: "My Topic" },
        { to: "/schedule", icon: <Calendar className="h-5 w-5" />, text: "Presentation Schedule" },
        { to: "/documents", icon: <FileSpreadsheet className="h-5 w-5" />, text: "Documents" },
      ],
    };

    return [...commonLinks, ...(roleSpecificLinks[user.role as keyof typeof roleSpecificLinks] || [])];
  };

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button
          className="fixed z-40 bottom-4 right-4 bg-navy text-white p-3 rounded-full shadow-lg"
          onClick={toggleSidebar}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "bg-sidebar text-sidebar-foreground h-screen flex-shrink-0 overflow-y-auto transition-all duration-300 ease-in-out z-30",
          isOpen 
            ? "w-64" 
            : isMobile 
              ? "w-0" 
              : "w-16",
          isMobile && !isOpen && "hidden"
        )}
      >
        {/* Logo and Title */}
        <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
          {isOpen ? (
            <h1 className="text-xl font-bold text-white">PFE Manager</h1>
          ) : (
            <span className="text-xl font-bold">PFE</span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="mt-6">
          <ul className="space-y-2 px-3">
            {getNavLinks().map((link, index) => (
              <li key={index}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-4 py-2 rounded-lg transition-colors duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )
                  }
                >
                  <span className="flex-shrink-0">{link.icon}</span>
                  {isOpen && <span className="ml-3">{link.text}</span>}
                </NavLink>
              </li>
            ))}

            <li className="mt-auto">
              <button
                onClick={logout}
                className="w-full flex items-center px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
                {isOpen && <span className="ml-3">Logout</span>}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
