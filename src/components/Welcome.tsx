import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const welcomeScreens = [
  {
    id: 1,
    title: "مرحبًا بك في مسجد الهدى",
    description: "تطبيق إسلامي شامل ليساعدك في عبادتك اليومية",
    image: "/welcome.jpg"
  },
  {
    id: 2,
    title: "القرآن الكريم",
    description: "اقرأ، ابحث، واستمع للقرآن الكريم",
    image: "/welcome.jpg"
  },
  {
    id: 3,
    title: "الأذكار والأدعية",
    description: "مجموعة من الأذكار والأدعية لكل وقت",
    image: "/welcome.jpg"
  },
  {
    id: 4,
    title: "مواقيت الصلاة",
    description: "تتبع أوقات الصلاة حتى لا تفوت فرضك",
    image: "/welcome.jpg"
  }
];

const Welcome: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const navigate = useNavigate();

  // 🔒 Check if user has already seen welcome
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (hasSeenWelcome === 'true') {
      navigate('/home');
    }
  }, [navigate]);

  const handleNext = () => {
    if (currentScreen < welcomeScreens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      // ✅ Mark as seen and navigate
      localStorage.setItem('hasSeenWelcome', 'true');
      navigate('/home');
    }
  };

  const screen = welcomeScreens[currentScreen];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="islamic-card w-full max-w-md islamic-pattern-border flex flex-col items-center">
        <div className="flex justify-center my-8">
          <div className="w-32 h-32 rounded-full bg-islamic-light border-4 border-islamic-gold/30 flex items-center justify-center overflow-hidden">
            <img src={screen.image} alt={screen.title} className="w-full h-full object-cover" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-islamic-green text-center mb-4 arabic-text">
          {screen.title}
        </h1>

        <p className="text-lg text-islamic-dark/80 text-center mb-8 arabic-text">
          {screen.description}
        </p>

        <div className="flex items-center justify-between w-full mb-8">
          <div className="flex space-x-2 rtl:space-x-reverse">
            {welcomeScreens.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentScreen ? 'bg-islamic-gold' : 'bg-islamic-green/30'
                }`}
              />
            ))}
          </div>

          <Button className="islamic-button rtl" onClick={handleNext}>
            {currentScreen < welcomeScreens.length - 1 ? "التالي" : "ابدأ"}
            <ArrowRight className="mr-2 h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
