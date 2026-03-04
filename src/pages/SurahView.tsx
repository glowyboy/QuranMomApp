
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import quran from '@/data/quran-simple.json'; // Fixed path case: Data -> data
import greenBookmark from '@/img/green-bookmark.png';

interface Verse {
  id: number;
  text: string;
}

interface Surah {
  id: number;
  name: string;
  verses: Verse[];
}

const SurahView: React.FC = () => {
  const { id } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(search);
  const ayahParam = Number(queryParams.get('ayah')) || 1;

  const [surah, setSurah] = useState<Surah | null>(null);
  const [currentMode, setCurrentMode] = useState<'written' | 'pages'>('written');
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarks, setBookmarks] = useState<Record<number, { ayahId: number }>>({});
  const versesPerPage = 10;

  const ayahRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const found = (quran as Surah[]).find((s) => s.id === Number(id));
    if (found) {
      setSurah(found);
    }
  }, [id]);

  useEffect(() => {
    const saved = localStorage.getItem('bookmarks');
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (ayahParam && ayahRefs.current[ayahParam]) {
      ayahRefs.current[ayahParam]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [surah]);

  const verses = useMemo(() => surah?.verses || [], [surah]);

  const paginatedVerses = useMemo(() => {
    const start = (currentPage - 1) * versesPerPage;
    return verses.slice(start, start + versesPerPage);
  }, [verses, currentPage]);

  const handleLongPress = (ayahId: number) => {
    if (surah) {
      const updated = { ...bookmarks, [surah.id]: { ayahId } };
      localStorage.setItem('bookmarks', JSON.stringify(updated));
      setBookmarks(updated);
    }
  };

  const handleMouseDown = (ayahId: number) => {
    timeoutRef.current = setTimeout(() => handleLongPress(ayahId), 800);
  };

  const handleMouseUp = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleBack = () => navigate('/quran');

  const renderVerses = (versesToRender: Verse[]) => (
    versesToRender.map((verse) => (
      <div
        key={verse.id}
        ref={(el) => (ayahRefs.current[verse.id] = el)}
        className="relative bg-islamic-beige/50 p-4 rounded-lg shadow hover:bg-islamic-beige/70 transition cursor-pointer"
        onMouseDown={() => handleMouseDown(verse.id)}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={() => handleMouseDown(verse.id)}
        onTouchEnd={handleMouseUp}
      >
        <p className="text-islamic-dark text-lg font-semibold">{verse.text}</p>
        <p className="text-sm text-islamic-dark/60 mt-1">آية {verse.id}</p>
        {bookmarks[surah?.id || 0]?.ayahId === verse.id && (
          <img
            src={greenBookmark}
            alt="Bookmark"
            className="absolute top-0 left-6 w-9 h-13"
          />
        )}
      </div>
    ))
  );

  return (
    <div className="p-4">
      <div className="islamic-card islamic-pattern-border">
        <h1 className="text-2xl font-bold text-islamic-green text-center mb-6 mt-4">
          سورة {surah?.name}
        </h1>

        <div className="flex justify-center mb-4 space-x-2 rtl:space-x-reverse">
          <Button
            variant={currentMode === 'written' ? 'default' : 'outline'}
            onClick={() => setCurrentMode('written')}
          >
            نص
          </Button>
          <Button
            variant={currentMode === 'pages' ? 'default' : 'outline'}
            onClick={() => setCurrentMode('pages')}
          >
            صفحات
          </Button>
        </div>

        <div className="space-y-3 text-right max-h-[60vh] overflow-y-auto mt-9">
          {currentMode === 'written'
            ? renderVerses(verses)
            : renderVerses(paginatedVerses)}
        </div>

        {currentMode === 'pages' && (
          <div className="flex justify-center items-center space-x-2 rtl:space-x-reverse mt-4">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              السابق
            </Button>
            <span className="text-sm text-islamic-dark">الصفحة {currentPage}</span>
            <Button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage * versesPerPage >= verses.length}
            >
              التالي
            </Button>
          </div>
        )}

        <Button className="mt-6 w-full islamic-button" onClick={handleBack}>
          العودة إلى السور
        </Button>
      </div>
    </div>
  );
};

export default SurahView;
