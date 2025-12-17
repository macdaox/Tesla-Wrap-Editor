'use client';

import { useEffect } from 'react';

export default function BuyMeACoffee() {
  useEffect(() => {
    // Check if script already exists to avoid duplicates
    if (document.querySelector('script[data-name="BMC-Widget"]')) return;

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

    // The widget script expects to find its configuration on the script tag itself.
    // It queries for script[data-name="BMC-Widget"]
    
    document.body.appendChild(script);

    return () => {
        // Cleanup if necessary, though usually widgets persist
    };
  }, []);

  return null;
}
