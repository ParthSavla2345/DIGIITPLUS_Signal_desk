import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './layouts/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { CreateIncidentPage } from './pages/CreateIncidentPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#1e293b' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/incidents/new" element={<CreateIncidentPage />} />
          <Route path="/incidents/:id" element={<IncidentDetailPage />} />
          <Route path="/knowledge" element={<KnowledgeBasePage />} />
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-xl font-bold text-slate-200 mb-2">Page Not Found</h2>
                  <a href="/" className="btn-primary inline-flex mt-4">Go to Dashboard</a>
                </div>
              </div>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
