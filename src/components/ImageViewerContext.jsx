import { createContext, useContext } from 'react';

// Lightweight app-wide context placeholder for a global image viewer.
// Individual pages currently manage their own <PhotoViewer /> instance
// and lightbox state locally (see Home.jsx, Gallery.jsx, etc.), so this
// provider is intentionally a simple pass-through. It exists so that
// `<ImageViewerProvider>` in App.jsx has something to render, and so a
// shared/global viewer can be introduced later without touching App.jsx.
const ImageViewerContext = createContext(null);

export function ImageViewerProvider({ children }) {
  return (
    <ImageViewerContext.Provider value={null}>
      {children}
    </ImageViewerContext.Provider>
  );
}

export function useImageViewer() {
  return useContext(ImageViewerContext);
}
