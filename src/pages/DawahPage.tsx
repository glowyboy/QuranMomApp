
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Book, Search } from 'lucide-react';
import { adhkarData, AdhkarCategory } from '@/data/adhkarData'; // Fixed path case: Data -> data
import AdhkarItem from '../components/AdhkarItem';
import { toast } from "@/components/ui/use-toast";

const DawahPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categories, setCategories] = useState<AdhkarCategory[]>([]);
  
  useEffect(() => {
    try {
      setCategories(adhkarData);
    } catch (error) {
      console.error("Error loading adhkar data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات الأذكار",
        variant: "destructive"
      });
    }
  }, []);
  
  // Memoize filtered categories for performance
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    
    return categories.filter(category => 
      category.category.includes(searchQuery) || 
      category.array.some(item => 
        item.text.includes(searchQuery) || 
        item.from.includes(searchQuery)
      )
    );
  }, [categories, searchQuery]);
  
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setSearchQuery(''); // Reset search when selecting a category
  };
  
  const handleBack = () => {
    setSelectedCategory(null);
  };

  if (selectedCategory !== null) {
    const category = categories.find(cat => cat.id === selectedCategory);
    const items = category?.array || [];
    
    return (
      <div className="p-4 pb-20">
        <div className="islamic-card islamic-pattern-border mb-4">
          <div className="flex items-center mb-4">
            <button onClick={handleBack} className="p-1">
              <ChevronLeft className="h-6 w-6 text-islamic-green" />
            </button>
            <h1 className="text-xl font-bold text-islamic-green text-center flex-1">
              {category?.category}
            </h1>
          </div>
          
          <div className="space-y-4">
            {items.map(item => (
              <AdhkarItem key={`${category?.id}-${item.id}-${item.filename}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 pb-20">
      <div className="islamic-card islamic-pattern-border">
        <h1 className="text-2xl font-bold text-islamic-green text-center mb-6">
          الأذكار والأدعية
        </h1>
        
        <div className="mb-4 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-islamic-green/60" />
          </div>
          <input
            type="text"
            placeholder="بحث في الأذكار..."
            className="w-full py-2 pl-10 pr-4 bg-islamic-beige/30 border border-islamic-gold/20 rounded-lg text-right"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCategories.length > 0 ? (
            filteredCategories.map(category => (
              <div 
                key={category.id}
                className="flex items-center p-4 bg-islamic-beige/40 rounded-xl border border-islamic-gold/20 cursor-pointer hover:bg-islamic-beige/60 transition-colors"
                onClick={() => handleCategorySelect(category.id)}
              >
                <div className="w-10 h-10 rounded-full bg-islamic-green/10 flex items-center justify-center text-2xl mr-3">
                  <Book className="h-5 w-5 text-islamic-green" />
                </div>
                <span className="text-islamic-dark font-medium text-lg">
                  {category.category}
                </span>
                <span className="mr-auto bg-islamic-green/10 text-islamic-green px-2 py-0.5 rounded-full text-xs">
                  {category.array.length}
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-islamic-dark/60">
              {categories.length === 0 ? "جاري تحميل الأذكار..." : "لا توجد نتائج للبحث"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DawahPage;
