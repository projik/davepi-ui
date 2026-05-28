import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, ConfigProvider } from '@davepi/ui-react';
import { App } from './App';
import davepiConfig from './davepi-ui.config';
import { resourceOverrides } from './resourceOverrides';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider config={davepiConfig} resourceOverrides={resourceOverrides}>
        <AuthProvider baseUrl={davepiConfig.apiBaseUrl}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>
);
