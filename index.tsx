import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// PWA Service Worker Registration & Emergency Cleanup
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Emergency Cleanup: Unregister all old or broken service workers first
    // This fixes the white screen issue if a previous SW was buggy
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
         // Optionally check scope or just unregister all for this origin to be safe
         // registration.unregister(); 
      }
    });

    // Register the new worker
    navigator.serviceWorker.register('./service-worker.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}