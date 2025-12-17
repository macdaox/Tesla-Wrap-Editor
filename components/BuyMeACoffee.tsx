'use client';

import { useEffect, useState } from 'react';
import { Coffee } from 'lucide-react';

export default function BuyMeACoffee() {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // 1. Check if widget already exists
    if (document.getElementById('bmc-wbtn')) return;

    // 2. Define the script setup
    const script = document.createElement('script');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-id', 'macdao');
    script.setAttribute('data-description', 'Support me on Buy me a coffee!');
    script.setAttribute('data-message', 'Thank you for visiting. You can now buy me a coffeee.');
    script.setAttribute('data-color', '#FF813F');
    script.setAttribute('data-position', 'Right');
    script.setAttribute('data-x_margin', '30');
    script.setAttribute('data-y_margin', '200');
    script.async = true;

    // 3. Handle loading and event triggering
    script.onload = () => {
        // The widget listens for DOMContentLoaded. If it already fired, we need to re-trigger it
        // or hope the widget checks readyState (which it often doesn't).
        // We dispatch a synthetic event to wake it up.
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            window.dispatchEvent(new Event('DOMContentLoaded'));
        }
    };

    script.onerror = () => {
        setShowFallback(true);
    };

    document.body.appendChild(script);

    // 4. Fallback timer: If widget doesn't appear in 2 seconds, show our button
    const timer = setTimeout(() => {
        if (!document.getElementById('bmc-wbtn')) {
            setShowFallback(true);
        }
    }, 2000);

    return () => {
        clearTimeout(timer);
        // We generally don't remove the script as it might have global side effects or be reused
    };
  }, []);

  if (!showFallback) return null;

  // Fallback Button Implementation
  return (
    <a
      href="https://www.buymeacoffee.com/macdao"
      target="_blank"
      rel="noreferrer"
      className="fixed z-[9999] flex items-center justify-center transition-transform hover:scale-105 shadow-lg"
      style={{
        bottom: '200px',
        right: '30px',
        width: '60px',
        height: '60px',
        backgroundColor: '#FF813F',
        borderRadius: '50%',
        color: 'white',
      }}
      title="Support me on Buy me a coffee!"
    >
      <img 
        src="https://cdn.buymeacoffee.com/widget/assets/coffee%20cup.svg" 
        alt="Buy Me A Coffee" 
        style={{ width: '36px', height: '36px' }}
      />
    </a>
  );
}
