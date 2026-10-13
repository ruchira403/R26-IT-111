import React, { createContext, useContext, useState } from 'react';

const PageContext = createContext();

export function PageProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' | 'validation' | 'caries'
  const [pageData, setPageData] = useState(null); // optional data passed between pages

  const navigateTo = (page, data = null) => {
    setPageData(data);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageContext.Provider value={{ currentPage, pageData, navigateTo }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePage() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePage must be used within a PageProvider');
  }
  return context;
}
