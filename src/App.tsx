import { useState, useEffect } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { GradientExtractor } from '@/components/GradientExtractor';

type View = 'landing' | 'extractor';

function App() {
  const [currentView, setCurrentView] = useState<View>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'extractor' ? 'extractor' : 'landing';
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setCurrentView(params.get('view') === 'extractor' ? 'extractor' : 'landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToLanding = () => {
    window.history.pushState({}, '', '/');
    setCurrentView('landing');
  };

  return (
    <>
      {currentView === 'landing' && <LandingPage />}
      {currentView === 'extractor' && (
        <GradientExtractor onBack={navigateToLanding} />
      )}
    </>
  );
}

export default App;
