import { Suspense, useState } from 'react';
import SplashPage from './pages/SplashPage';
import IntroPage from './pages/IntroPage';
import Calculator from './pages/Calculator';
import Results from './pages/Results';
import Awareness from './pages/Awareness';

function App() {
  const [currentPage, setCurrentPage] = useState<'splash' | 'intro' | 'calculator' | 'results' | 'awareness'>('splash');
  const [footprintData, setFootprintData] = useState<any>(null);

  return (
    <div className="min-h-screen bg-background text-white font-sans overflow-hidden">
      <Suspense fallback={<div className="h-screen flex items-center justify-center text-accent">Loading GreenPrint...</div>}>
        {currentPage === 'splash'      && <SplashPage onEnter={() => setCurrentPage('intro')} />}
        {currentPage === 'intro'       && <IntroPage onStart={() => setCurrentPage('calculator')} />}
        {currentPage === 'calculator'  && <Calculator onComplete={(data) => { setFootprintData(data); setCurrentPage('results'); }} />}
        {currentPage === 'results'     && <Results data={footprintData} onExplore={() => setCurrentPage('awareness')} />}
        {currentPage === 'awareness'   && <Awareness onBack={() => setCurrentPage('splash')} />}
      </Suspense>
    </div>
  );
}

export default App;
