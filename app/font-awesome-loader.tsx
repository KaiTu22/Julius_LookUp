'use client';

import { useEffect, useState } from 'react';

export default function FontAwesomeLoader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check if Font Awesome is already loaded
    if (document.querySelector('link[href*="font-awesome"]')) {
      setLoaded(true);
      return;
    }

    // Create and append the link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    link.onload = () => setLoaded(true);
    document.head.appendChild(link);

    return () => {
      // Clean up if needed
    };
  }, []);

  return null;
}
