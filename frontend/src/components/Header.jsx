import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, Home, Users, Menu, X, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../services/api";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get("/notifications/unread-count");
        setUnreadCount(res.data.unreadCount || 0);
      } catch {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/dashboard", label: "Inicio", icon: Home },
    { to: "/groups", label: "Grupos", icon: Users },
    { to: "/notifications", label: "Notificacoes", icon: Bell, badge: unreadCount },
    { to: "/profile", label: "Perfil", icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-blue-600 text-xl font-black tracking-tight">
            Conecta<span className="text-blue-400">Serv</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon, badge }) => (
            <Link
              key={to}
              to={to}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                isActive(to)
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={18} />
              {label}
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition px-3 py-2 rounded-lg hover:bg-red-50"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-gray-600"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4">
          {navLinks.map(({ to, label, icon: Icon, badge }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                isActive(to)
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              <Icon size={18} />
              {label}
              {badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ml-auto">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-500 w-full"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
