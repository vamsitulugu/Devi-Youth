import { useEffect, useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './components/admin/Toast';
import { ImageViewerProvider } from './components/ImageViewerContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Splash from './components/Splash';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Announcements from './pages/Announcements';
import Events from './pages/Events';
import Laddu from './pages/Laddu';
import Lottery from './pages/Lottery';
import Committee from './pages/Committee';
import Gallery from './pages/Gallery';
import History from './pages/History';
import Contacts from './pages/Contacts';
import More from './pages/More';
import Receipt from './pages/Receipt';
import NotFound from './pages/NotFound';

// Admin screens are lazy-loaded into a separate chunk. Villagers browsing
// the public pages — the vast majority of visits — never pay for this
// code; it's only fetched once someone actually opens /admin.
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const Login = lazy(() => import('./pages/admin/Login'));
const Join = lazy(() => import('./pages/admin/Join'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ContentHub = lazy(() => import('./pages/admin/ContentHub'));
const MoneyDashboard = lazy(() => import('./pages/admin/MoneyDashboard'));
const ManageAnnouncements = lazy(() => import('./pages/admin/ManageAnnouncements'));
const ManageEvents = lazy(() => import('./pages/admin/ManageEvents'));
const ManageCommittee = lazy(() => import('./pages/admin/ManageCommittee'));
const ManageLaddu = lazy(() => import('./pages/admin/ManageLaddu'));
const ManageLottery = lazy(() => import('./pages/admin/ManageLottery'));
const ManageContacts = lazy(() => import('./pages/admin/ManageContacts'));
const ManageDonations = lazy(() => import('./pages/admin/ManageDonations'));
const ManageDeletedDonations = lazy(() => import('./pages/admin/ManageDeletedDonations'));
const PendingSends = lazy(() => import('./pages/admin/PendingSends'));
const ManageExpenses = lazy(() => import('./pages/admin/ManageExpenses'));
const ManageGallery = lazy(() => import('./pages/admin/ManageGallery'));
const Settings = lazy(() => import('./pages/admin/Settings'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Villagers installing the public site get "Devi Youth Updates" as their
// home-screen app; committee/admin members installing from inside /admin
// get their own "Devi Youth Committee" manifest instead — same codebase,
// two distinct installable identities.
function DynamicManifest() {
  const { pathname } = useLocation();
  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link) return;
    link.setAttribute('href', pathname.startsWith('/admin') ? '/manifest-admin.webmanifest' : '/manifest.webmanifest');
  }, [pathname]);
  return null;
}

function Shell() {
  return (
    <div className="app-shell">
      <div className="app-shell-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/events" element={<Events />} />
          <Route path="/laddu" element={<Laddu />} />
          <Route path="/lottery" element={<Lottery />} />
          <Route path="/committee" element={<Committee />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/history" element={<History />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/more" element={<More />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

function AdminFallback() {
  return (
    <div className="app-shell" style={{ paddingBottom: 0 }}>
      <div className="app-shell-content">
        <div className="page" style={{ minHeight: '100vh', justifyContent: 'center' }}>
          <div className="card card-pad skeleton-row" style={{ height: 76 }} />
        </div>
      </div>
    </div>
  );
}

function AdminRoutes() {
  return (
    <Suspense fallback={<AdminFallback />}>
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/join" element={<Join />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout><AdminDashboard /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/content"
        element={
          <ProtectedRoute>
            <AdminLayout><ContentHub /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/content/announcements"
        element={
          <ProtectedRoute>
            <AdminLayout><ManageAnnouncements /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/content/events"
        element={
          <ProtectedRoute>
            <AdminLayout><ManageEvents /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/content/committee"
        element={
          <ProtectedRoute>
            <AdminLayout><ManageCommittee /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/content/laddu"
        element={
          <ProtectedRoute>
            <AdminLayout><ManageLaddu /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/content/lottery"
        element={
          <ProtectedRoute>
            <AdminLayout><ManageLottery /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/content/contacts"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout><ManageContacts /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/content/donations"
        element={
          <ProtectedRoute>
            <AdminLayout><ManageDonations /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/content/expenses"
        element={
          <ProtectedRoute>
            <AdminLayout><ManageExpenses /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/money"
        element={
          <ProtectedRoute>
            <AdminLayout><MoneyDashboard /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/money/deleted-donations"
        element={
          <ProtectedRoute>
            <AdminLayout><ManageDeletedDonations /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/money/pending-sends"
        element={
          <ProtectedRoute>
            <AdminLayout><PendingSends /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/gallery"
        element={
          <ProtectedRoute>
            <AdminLayout><ManageGallery /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <AdminLayout><Settings /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <div className="page">
                <div className="card card-pad empty-state">That admin page doesn't exist.</div>
              </div>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
    </Suspense>
  );
}

function ReceiptRoutes() {
  return (
    <Routes>
      <Route path="/r/:id" element={<Receipt />} />
    </Routes>
  );
}

function Root() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isReceipt = location.pathname.startsWith('/r/');
  return (
    <>
      <ScrollToTop />
      <DynamicManifest />
      {isReceipt ? <ReceiptRoutes /> : isAdmin ? <AdminRoutes /> : <Shell />}
    </>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <ImageViewerProvider>
            {showSplash ? (
              <Splash />
            ) : (
              <HashRouter>
                <Root />
              </HashRouter>
            )}
          </ImageViewerProvider>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}