
import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Book, MessageSquare, Clock, Settings } from 'lucide-react';

const MainLayout: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    {
      path: '/quran',
      name: 'القرآن',
      icon: Book
    },
    {
      path: '/dawah',
      name: 'الدعوة',
      icon: MessageSquare
    },
    {
      path: '/prayer-times',
      name: 'مواقيت الصلاة',
      icon: Clock
    },
    {
      path: '/settings',
      name: 'الإعدادات',
      icon: Settings
    }
  ];
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-islamic-light/90 border-t border-islamic-gold/30 backdrop-blur-md">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'text-islamic-gold' : 'text-islamic-green'}`
              }
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
