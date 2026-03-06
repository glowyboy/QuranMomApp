// QuranPage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, History, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import quran from '@/data/quran-simple.json'; // Fixed path case: Data -> data
import { useNavigate } from 'react-router-dom';
const normalizeArabic = (text: string) => {
  return text
    .normalize('NFD')
    // Remove all diacritics (tashkeel)
    .replace(/[\u064B-\u065F]/g, '') // Fatha, Damma, Kasra, Sukun, Shadda, etc.
    .replace(/[\u0670\u0674\u06D6-\u06ED]/g, '') // Additional diacritics
    // Normalize Alef variations
    .replace(/[إأآٱ]/g, 'ا')
    // Normalize all Hamza variations to empty (to match regardless of hamza position)
    .replace(/[ءؤئ]/g, '')
    // Normalize Yaa variations
    .replace(/[ىيۍ]/g, 'ي')
    // Normalize Taa Marbuta
    .replace(/ة/g, 'ه')
    // Remove Tatweel (elongation)
    .replace(/ـ/g, '')
    // Remove zero-width characters
    .replace(/[\u200B-\u200F\u202A-\u202E]/g, '')
    // Remove extra spaces
    .replace(/\s+/g, '')
    // Keep only Arabic letters
    .replace(/[^\u0621-\u063A\u0641-\u064A]/g, '');
};
const QuranPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRead, setLastRead] = useState<{
    surahId: number;
    ayahId: number;
  } | null>(null);
  const [maxResults, setMaxResults] = useState(10);
  const [selectedMuqattaat, setSelectedMuqattaat] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const surahs = useMemo(() => quran, []);

  // Muqatta'at (disjointed letters) mapping
  const muqattaatMap: { [key: string]: number[] } = {
    'الم': [2, 3, 29, 30, 31, 32],
    'المص': [7],
    'الر': [10, 11, 12, 14, 15],
    'المر': [13],
    'كهيعص': [19],
    'طه': [20],
    'طسم': [26, 28],
    'طس': [27],
    'يس': [36],
    'ص': [38],
    'حم': [40, 41, 42, 43, 44, 45, 46],
    'حمعسق': [42],
    'ق': [50],
    'ن': [68]
  };

  const muqattaatOptions = Object.keys(muqattaatMap);
  useEffect(() => {
    const saved = localStorage.getItem('lastRead');
    if (saved) setLastRead(JSON.parse(saved));

    // Load max search results setting
    const savedMaxResults = localStorage.getItem('max-search-results');
    if (savedMaxResults) {
      setMaxResults(parseInt(savedMaxResults, 10));
    }

    // Load saved muqattaat filter
    const savedMuqattaat = localStorage.getItem('selected-muqattaat');
    if (savedMuqattaat) {
      setSelectedMuqattaat(savedMuqattaat);
    }

    // Load saved search query
    const savedSearchQuery = localStorage.getItem('quran-search-query');
    if (savedSearchQuery) {
      setSearchQuery(savedSearchQuery);
    }

    // Load search history
    const savedHistory = localStorage.getItem('quran-search-history');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    if (showHistory) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistory]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  const searchResults = useMemo(() => {
    const query = normalizeArabic(searchQuery.trim());
    if (!query) return [];
    
    // Get the surahs to search in (filtered or all)
    const surahsToSearch = selectedMuqattaat 
      ? surahs.filter(surah => (muqattaatMap[selectedMuqattaat] || []).includes(surah.id))
      : surahs;
    
    const results: {
      surahName: string;
      text: string;
      ayahId: number;
      surahId: number;
    }[] = [];
    
    for (const surah of surahsToSearch) {
      for (const verse of surah.verses) {
        const plain = normalizeArabic(verse.text);
        if (plain.includes(query)) {
          results.push({
            surahName: surah.name,
            text: verse.text,
            ayahId: verse.id,
            surahId: surah.id
          });

          // Limit results based on user preference
          if (results.length >= maxResults) {
            break;
          }
        }
      }

      // Break out of outer loop if we already have enough results
      if (results.length >= maxResults) {
        break;
      }
    }

    // Reverse the results to show from bottom to top
    return results.reverse();
  }, [searchQuery, surahs, maxResults, selectedMuqattaat, muqattaatMap]);
  const handleSurahClick = (surahId: number, ayahId: number = 1) => {
    localStorage.setItem('lastRead', JSON.stringify({
      surahId,
      ayahId
    }));
    navigate(`/surah/${surahId}?ayah=${ayahId}`);
  };
  const handleLongPress = (surahId: number, ayahId: number) => {
    localStorage.setItem('lastRead', JSON.stringify({
      surahId,
      ayahId
    }));
    setLastRead({
      surahId,
      ayahId
    });
  };
  const handleMouseDown = (surahId: number, ayahId: number) => {
    timeoutRef.current = setTimeout(() => handleLongPress(surahId, ayahId), 800);
  };
  const handleMouseUp = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
  const handleContinueReading = () => {
    if (lastRead) handleSurahClick(lastRead.surahId, lastRead.ayahId);
  };

  const handleMuqattaatFilter = (muqattaat: string) => {
    if (selectedMuqattaat === muqattaat) {
      // Toggle off if clicking the same filter
      setSelectedMuqattaat(null);
      localStorage.removeItem('selected-muqattaat');
    } else {
      setSelectedMuqattaat(muqattaat);
      localStorage.setItem('selected-muqattaat', muqattaat);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    localStorage.setItem('quran-search-query', value);
    
    // Add to search history when user types (with debounce effect)
    if (value.trim() && value.length >= 2) {
      // Use a timeout to avoid adding every keystroke
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        addToSearchHistory(value.trim());
      }, 1000); // Add to history after 1 second of no typing
    }
  };

  const addToSearchHistory = (query: string) => {
    if (!query.trim() || query.length < 2) return;
    
    const trimmedQuery = query.trim();
    let history = [...searchHistory];
    
    // Remove if already exists
    history = history.filter(item => item !== trimmedQuery);
    
    // Add to beginning
    history.unshift(trimmedQuery);
    
    // Keep only last 10 searches
    history = history.slice(0, 10);
    
    setSearchHistory(history);
    localStorage.setItem('quran-search-history', JSON.stringify(history));
  };

  const handleVerseClick = (surahId: number, ayahId: number) => {
    // Add current search query to history when clicking on a verse
    if (searchQuery.trim()) {
      addToSearchHistory(searchQuery);
    }
    
    // Navigate to the verse
    handleSurahClick(surahId, ayahId);
  };

  const handleHistoryClick = (historyQuery: string) => {
    setSearchQuery(historyQuery);
    localStorage.setItem('quran-search-query', historyQuery);
    setShowHistory(false);
  };

  const removeFromSearchHistory = (queryToRemove: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the history click
    const updatedHistory = searchHistory.filter(item => item !== queryToRemove);
    setSearchHistory(updatedHistory);
    localStorage.setItem('quran-search-history', JSON.stringify(updatedHistory));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    localStorage.removeItem('quran-search-query');
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };

  const filteredSurahs = useMemo(() => {
    if (!selectedMuqattaat) return surahs;
    const surahIds = muqattaatMap[selectedMuqattaat] || [];
    return surahs.filter(surah => surahIds.includes(surah.id));
  }, [surahs, selectedMuqattaat]);
  return <div className="p-4">
      <div className="islamic-card islamic-pattern-border mb-4">
        <h1 className="text-2xl font-bold text-islamic-green text-center mb-6">
          القرآن الكريم
        </h1>

        <div className="relative mb-6" ref={historyRef}>
          <Input 
            type="text" 
            placeholder="ابحث عن آية..." 
            className="pl-20 pr-10 bg-islamic-beige/50 border-islamic-gold/30" 
            dir="rtl" 
            value={searchQuery} 
            onChange={e => handleSearchChange(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-islamic-green/60" />
          
          {/* History Icon */}
          <button
            onClick={toggleHistory}
            className="absolute left-10 top-2.5 text-islamic-dark/60 hover:text-islamic-dark transition-colors"
            aria-label="Search history"
          >
            <History className="h-5 w-5" />
          </button>

          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-2.5 text-islamic-dark/60 hover:text-islamic-dark transition-colors"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* History Dropdown with better scrolling */}
          {showHistory && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-islamic-gold/30 rounded-lg shadow-lg z-10">
              <div className="p-2 max-h-80 overflow-y-auto">
                <p className="text-xs text-islamic-dark/60 px-3 py-2 text-right sticky top-0 bg-white">عمليات البحث السابقة:</p>
                <div className="space-y-1">
                  {searchHistory.map((historyItem, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(historyItem)}
                      className="w-full text-right px-3 py-2 hover:bg-islamic-beige/50 rounded transition-colors text-islamic-dark group"
                      dir="rtl"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={(e) => removeFromSearchHistory(historyItem, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                          aria-label="حذف من السجل"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                        <div className="flex items-center gap-2">
                          <span>{historyItem}</span>
                          <History className="h-4 w-4 text-islamic-green/60" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Muqatta'at Filter - Collapsible */}
        <div className="mb-4">
          <Button
            onClick={toggleFilter}
            variant="outline"
            className="w-full flex items-center justify-between border-islamic-gold/30 text-islamic-dark hover:bg-islamic-beige/50"
          >
            <span className="text-sm">
              {selectedMuqattaat ? `تصفية: ${selectedMuqattaat}` : 'تصفية حسب الحروف المقطعة'}
            </span>
            <Filter className="h-4 w-4" />
          </Button>
          
          {showFilter && (
            <div className="mt-3 p-3 bg-islamic-beige/20 rounded-lg border border-islamic-gold/20">
              <div className="flex flex-wrap gap-2 justify-end" dir="rtl">
                {muqattaatOptions.map((muqattaat) => (
                  <Button
                    key={muqattaat}
                    onClick={() => handleMuqattaatFilter(muqattaat)}
                    variant={selectedMuqattaat === muqattaat ? "default" : "outline"}
                    className={`text-sm px-3 py-1 h-auto ${
                      selectedMuqattaat === muqattaat 
                        ? 'bg-islamic-green text-white hover:bg-islamic-green/90' 
                        : 'border-islamic-gold/30 text-islamic-dark hover:bg-islamic-beige/50'
                    }`}
                  >
                    {muqattaat}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {lastRead && <Button className="islamic-button w-full mb-4" onClick={handleContinueReading}>
            متابعة القراءة
          </Button>}
      </div>

      <div className="islamic-card islamic-pattern-border">
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {searchQuery.trim() ? searchResults.map((result, index) => <div key={index} onClick={() => handleVerseClick(result.surahId, result.ayahId)} onMouseDown={() => handleMouseDown(result.surahId, result.ayahId)} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} className="relative p-5 hover:bg-islamic-beige/50  rounded-lg transition-colors cursor-pointer text-right">
                <p className="text-islamic-dark font-medium ">{result.text}</p>
            
                <p className="text-sm text-islamic-dark/70 mt-1 ">
                  سورة {result.surahName} - آية {result.ayahId}
                </p>
              </div>) : filteredSurahs.map(surah => <div key={surah.id} onClick={() => handleSurahClick(surah.id)} className="flex justify-between items-center p-3 hover:bg-islamic-beige/50 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-islamic-green/10 flex items-center justify-center text-islamic-green font-semibold ml-3 px-[9px] mx-[17px]">
                    {surah.id}
                  </div>
                  <span className="text-islamic-dark font-medium">{surah.name}</span>
                </div>
                <span className="text-sm text-islamic-dark/70">
                  {surah.total_verses || surah.verses.length} آية
                </span>
              </div>)}
        </div>
      </div>
    </div>;
};
export default QuranPage;