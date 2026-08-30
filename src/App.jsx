import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { AuthProvider, useAuth } from './auth/AuthContext';
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
import Donations from './pages/Donations';
import More from './pages/More';
import Receipt from './pages/Receipt';
import NotFound from './pages/NotFound';
import AppDownloadAd from './components/AppDownloadAd';
import PullToRefresh from './components/PullToRefresh';

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
        <PullToRefresh>
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
            <Route path="/donations" element={<Donations />} />
            <Route path="/more" element={<More />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PullToRefresh>
      </div>
      <BottomNav />
      <AppDownloadAd />
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
    <PullToRefresh>
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
    </PullToRefresh>
  );
}

function ReceiptRoutes() {
  return (
    <Routes>
      <Route path="/r/:id" element={<Receipt />} />
    </Routes>
  );
}

// Once someone is actually signed in, the device/browser back button
// (or a back-swipe gesture) should never silently drop them out of the
// admin area into the villager site — that's an easy accidental tap to
// make mid-task, and re-authenticating afterward is annoying. Back
// navigation *within* admin (e.g. Donations -> Money Dashboard) is left
// completely alone; this only intercepts a back-press that would land
// outside "/admin" entirely, and immediately cancels it by moving
// forward again. The one intentional way out while signed in is the
// "Villager App" button on the dashboard (a normal push navigation,
// which this never touches).
function useStayInAdminOnBack(isAuthenticated) {
  const location = useLocation();
  const navType = useNavigationType();
  const navigate = useNavigate();
  const wasAdminRef = useRef(location.pathname.startsWith('/admin'));

  useEffect(() => {
    const isAdminPath = location.pathname.startsWith('/admin');
    if (navType === 'POP' && isAuthenticated && wasAdminRef.current && !isAdminPath) {
      navigate(1); // undo this specific back-navigation, stay in admin
      return;
    }
    wasAdminRef.current = isAdminPath;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, navType, isAuthenticated]);
}

function Root() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isReceipt = location.pathname.startsWith('/r/');
  const { user } = useAuth();
  useStayInAdminOnBack(Boolean(user));
  // Needs to run inside LanguageProvider (reads/writes the villager's
  // language choice against their saved push token), so it lives here
  // rather than up in App() where the providers haven't mounted yet.
  useNativeNotifications();
  return (
    <>
      <ScrollToTop />
      <DynamicManifest />
      {isReceipt ? <ReceiptRoutes /> : isAdmin ? <AdminRoutes /> : <Shell />}
    </>
  );
}

// On Android 13+ (targetSdk 36 here), notifications need an explicit
// runtime permission grant on top of the manifest entry, or they never
// show even though nothing "fails". This asks once per install, wires
// up local notifications (for on-device reminders like "event starts
// today") and push notifications (for anything sent from a server).
//
// Push delivery itself needs a Firebase project: drop a
// google-services.json into android/app/ (the build already checks for
// it — see android/app/build.gradle) and it starts working with no
// further code changes, since the plugin and permissions are already
// wired up here. Until that file exists, registration simply won't
// produce a token, and everything else in the app is unaffected.
//
// Once a token comes back, it's upserted into the `device_tokens`
// Supabase table (see supabase/12_push_notifications.sql) along with
// the villager's current language choice, so the send-push Edge
// Function (supabase/functions/send-push) can send Telugu text to
// Telugu-language devices and English text to everyone else.
function useNativeNotifications() {
  const { lang } = useLanguage();
  const langRef = useRef(lang);
  const tokenRef = useRef(null);
  langRef.current = lang;

  // Registration only fires once per install (the token barely
  // changes), but someone can switch EN/తెలుగు at any point afterward
  // — keep the saved row's language in sync so future pushes land in
  // whichever language they're currently reading in.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !isSupabaseConfigured || !tokenRef.current) return;
    supabase
      .from('device_tokens')
      .update({ lang })
      .eq('token', tokenRef.current)
      .then(({ error }) => {
        if (error) console.warn('Updating push token language failed:', error.message);
      });
  }, [lang]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    LocalNotifications.requestPermissions().catch(() => {});

    PushNotifications.requestPermissions()
      .then((result) => {
        if (result.receive !== 'granted') return;
        return PushNotifications.register();
      })
      .catch(() => {});

    const regListener = PushNotifications.addListener('registration', (token) => {
      console.log('Push registration token:', token.value);
      tokenRef.current = token.value;
      if (!isSupabaseConfigured) return;
      supabase
        .from('device_tokens')
        .upsert(
          { token: token.value, platform: Capacitor.getPlatform(), lang: langRef.current },
          { onConflict: 'token' },
        )
        .then(({ error }) => {
          if (error) console.warn('Saving push token failed:', error.message);
        });
    });
    const regErrorListener = PushNotifications.addListener('registrationError', (err) => {
      console.warn('Push registration error:', err.error);
    });
    const receivedListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received in foreground:', notification);
    });
    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push tapped:', action.notification);
    });

    return () => {
      regListener.remove();
      regErrorListener.remove();
      receivedListener.remove();
      actionListener.remove();
    };
  }, []);
}

// On the native Android/iOS shell, the OS status bar (clock, network,
// battery icons) draws on top of the web page by default, which is what
// let it collide visually with the Toranam garland at the top of our own
// header. This pins the status bar to a plain vermillion bar of its own,
// reserves real screen space for it (so our header renders *below* it
// instead of underneath it), and switches the status bar icons to light
// colour so they stay readable against the red.
function useNativeStatusBar() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#C22B1F' }).catch(() => {});
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  }, []);
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  useNativeStatusBar();

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