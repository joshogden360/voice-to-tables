import React from 'react';
import { ChatScreen } from './components/ChatScreen';

const App: React.FC = () => {
  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-200">
      <div className="w-full h-full md:max-w-screen-2xl md:h-full md:mx-auto bg-white md:shadow-2xl md:overflow-hidden relative">
          <ChatScreen />
      </div>
    </div>
  );
};

export default App;