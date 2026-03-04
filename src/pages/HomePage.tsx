
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, MessageSquare, Clock, Settings } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  const menuItems = [
    {
      id: 'quran',
      name: 'القرآن الكريم',
      icon: Book,
      color: 'bg-islamic-green',
      path: '/quran'
    },
    {
      id: 'dawah',
      name: 'الأذكار والأدعية',
      icon: MessageSquare,
      color: 'bg-islamic-gold',
      path: '/dawah'
    },
    {
      id: 'prayer-times',
      name: 'مواقيت الصلاة',
      icon: Clock,
      color: 'bg-islamic-green',
      path: '/prayer-times'
    },
    {
      id: 'settings',
      name: 'الإعدادات',
      icon: Settings,
      color: 'bg-islamic-gold',
      path: '/settings'
    }
  ];
  
  return (
    <div className="p-4">
      <div className="islamic-card islamic-pattern-border mb-6">
        <h1 className="text-3xl font-bold text-islamic-green text-center mb-2">
          مسجد الهدى
        </h1>
        <p className="text-islamic-dark/80 text-center">
          تطبيق إسلامي شامل ليساعدك في عبادتك اليومية
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <div 
            key={item.id}
            className="islamic-card flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-islamic-beige/20 transition-colors"
            onClick={() => navigate(item.path)}
          >
            <div className={`${item.color} w-14 h-14 rounded-full flex items-center justify-center mb-3`}>
              <item.icon className="h-7 w-7 text-islamic-light" />
            </div>
            <span className="text-lg font-medium text-islamic-dark">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
