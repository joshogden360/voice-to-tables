import React from 'react';
import { ChatScreen } from './components/ChatScreen';
import { AuthWrapper } from './components/AuthWrapper';
import { ErrorBoundary } from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthWrapper>
        <ChatScreen />
      </AuthWrapper>
    </ErrorBoundary>
  );
};

export default App;