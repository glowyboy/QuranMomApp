
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to welcome screen
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-islamic-beige">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-islamic-green">مسجد الهدى</h1>
        <p className="text-xl text-islamic-dark">جاري التحميل...</p>
      </div>
    </div>
  );
};

export default Index;
