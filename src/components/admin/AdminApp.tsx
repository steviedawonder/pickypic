import { useState } from 'react';
import PasswordGate from './PasswordGate';
import AdminLayout from './shared/AdminLayout';
import { useToast } from './shared/Toast';

// Page components
import Dashboard from './pages/Dashboard';
import BlogList from './pages/BlogList';
import BlogEditor from './pages/BlogEditor';
import PortfolioManager from './pages/PortfolioManager';
import PortfolioEditor from './pages/PortfolioEditor';
import FAQManager from './pages/FAQManager';
import CategoryManager from './pages/CategoryManager';
import CollaborationManager from './pages/CollaborationManager';
import InquiryManager from './pages/InquiryManager';
import PopupManager from './pages/PopupManager';
import BannerManager from './pages/BannerManager';
import EventManager from './pages/EventManager';
import DownloadManager from './pages/DownloadManager';
import FooterManager from './pages/FooterManager';
import SettingsPage from './pages/SettingsPage';

export default function AdminApp() {
  const [page, setPage] = useState('dashboard');
  const [editId, setEditId] = useState<string | undefined>();
  const { showToast, ToastContainer } = useToast();

  const navigate = (p: string, id?: string) => {
    setPage(p);
    setEditId(id);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />;
      case 'blogs': return <BlogList onNavigate={navigate} />;
      case 'blog-new': return <BlogEditor onNavigate={navigate} />;
      case 'blog-edit': return <BlogEditor postId={editId} onNavigate={navigate} />;
      case 'collaboration': return <CollaborationManager />;
      case 'inquiry': return <InquiryManager />;
      case 'portfolio': return <PortfolioManager onNavigate={navigate} />;
      case 'portfolio-new': return <PortfolioEditor onNavigate={navigate} />;
      case 'portfolio-edit': return <PortfolioEditor itemId={editId} onNavigate={navigate} />;
      case 'faq': return <FAQManager />;
      case 'popup': return <PopupManager />;
      case 'banner': return <BannerManager />;
      case 'event': return <EventManager />;
      case 'downloads': return <DownloadManager />;
      case 'footer': return <FooterManager />;
      case 'categories': return <CategoryManager />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <PasswordGate>
      <AdminLayout currentPage={page} onNavigate={navigate}>
        <ToastContainer />
        {renderPage()}
      </AdminLayout>
    </PasswordGate>
  );
}
