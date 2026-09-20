import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * GoogleAuthButton
 * Custom dark glassmorphism button with a transparent native GSI overlay.
 * Maintains 100% of VentureIQ's sleek visual design while satisfying
 * mobile browser (iOS Safari / Android Chrome) strict user-gesture popup requirements.
 */
export default function GoogleAuthButton({ onCredential, label = 'Continue with Google', disabled = false }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const overlayRef            = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('your-google')) {
      setErr('Google Client ID is not configured.');
      return;
    }

    const initGsi = () => {
      if (!window.google?.accounts?.id || !overlayRef.current) return;
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

        overlayRef.current.innerHTML = '';
        const width = overlayRef.current.offsetWidth || 340;
        window.google.accounts.id.renderButton(overlayRef.current, {
          type: 'standard',
          size: 'large',
          width: width,
        });
      } catch (e) {
        console.error('Google GSI overlay error:', e);
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const existing = document.getElementById('google-gsi-script');
      if (!existing) {
        const script = document.createElement('script');
        script.id    = 'google-gsi-script';
        script.src   = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setTimeout(initGsi, 100);
        document.head.appendChild(script);
      } else {
        const timer = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(timer);
            initGsi();
          }
        }, 150);
        return () => clearInterval(timer);
      }
    }
  }, [onCredential]);

  const handleFallbackClick = () => {
    if (disabled || loading) return;
    setErr('');
    if (!window.google?.accounts?.id) {
      setErr('Google Sign-In is still loading. Please try again in a moment.');
      return;
    }
    setLoading(true);
    window.google.accounts.id.prompt((notification) => {
      setLoading(false);
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setErr('Google sign-in prompt was suppressed. Please ensure popups and third-party cookies are allowed.');
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', width: '100%' }}>
      {/* Outer Button maintaining exact custom dark styling */}
      <div
        onClick={handleFallbackClick}
        style={{
          position: 'relative',
          width: '100%',
          height: 46,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10,
          color: 'var(--clr-text-primary)',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.5 : 1,
          fontFamily: 'inherit',
          letterSpacing: '0.01em',
          overflow: 'hidden',
        }}
        onMouseEnter={e => {
          if (!disabled && !loading) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)';
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Transparent native GSI button overlay for seamless mobile touch */}
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.001,
            zIndex: 5,
            cursor: 'pointer',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />

        {loading ? (
          <>
            <span style={{
              width: 16, height: 16,
              border: '2px solid rgba(255,255,255,0.25)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin-slow 0.6s linear infinite',
              display: 'inline-block',
              flexShrink: 0,
            }} />
            Connecting to Google…
          </>
        ) : (
          <>
            {/* Google "G" SVG logo */}
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.3C4.672 4.169 6.656 3.58 9 3.58z"/>
            </svg>
            {label}
          </>
        )}
      </div>

      {err && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: '0.8rem',
          color: 'var(--clr-danger, #ef4444)',
          lineHeight: 1.4,
        }}>
          ⚠️ {err}
        </div>
      )}
    </div>
  );
}
