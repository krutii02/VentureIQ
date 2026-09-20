import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * GoogleAuthButton
 * Renders the official Google Sign-In button with GSI library,
 * ensuring seamless user-activation and popup behavior across all browsers.
 */
export default function GoogleAuthButton({ onCredential, label = 'Continue with Google', disabled = false }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ready, setReady] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('your-google')) {
      setErr('Google Client ID is not configured.');
      return;
    }

    const initGsi = () => {
      if (!window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            setLoading(false);
            if (response.credential) {
              onCredential(response.credential);
            } else {
              setErr('Google sign-in was cancelled or failed.');
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          const parentWidth = containerRef.current.parentElement?.offsetWidth || containerRef.current.offsetWidth || 340;
          const targetWidth = Math.min(Math.max(parentWidth, 240), 400);

          window.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: targetWidth,
            logo_alignment: 'left',
          });
          setReady(true);
        }
      } catch (e) {
        console.error('Google GSI initialization error:', e);
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const existing = document.getElementById('google-gsi-script');
      if (!existing) {
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setTimeout(initGsi, 100);
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(interval);
            initGsi();
          }
        }, 150);
        return () => clearInterval(interval);
      }
    }
  }, [onCredential]);

  const handleFallbackClick = () => {
    setErr('');
    if (!window.google?.accounts?.id) {
      setErr('Google Sign-In is loading or blocked by an ad-blocker. Please allow accounts.google.com.');
      return;
    }
    setLoading(true);
    window.google.accounts.id.prompt((notification) => {
      setLoading(false);
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setErr('Google sign-in prompt was closed or suppressed by the browser. Please ensure third-party cookies or popups are allowed.');
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', alignItems: 'center' }}>
      {/* Official Google GSI button target */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          display: ready ? 'flex' : 'none',
          justifyContent: 'center',
          minHeight: 44,
          opacity: disabled || loading ? 0.6 : 1,
          pointerEvents: disabled || loading ? 'none' : 'auto',
        }}
      />

      {/* Fallback button shown if GSI is still rendering or blocked */}
      {!ready && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={disabled || loading}
          style={{
            width: '100%',
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            color: 'var(--clr-text-primary)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            'Connecting to Google…'
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.3C4.672 4.169 6.656 3.58 9 3.58z"/>
              </svg>
              {label}
            </>
          )}
        </button>
      )}

      {err && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: '0.8rem',
          color: 'var(--clr-danger, #ef4444)',
          lineHeight: 1.4,
          width: '100%',
        }}>
          ⚠️ {err}
        </div>
      )}
    </div>
  );
}
