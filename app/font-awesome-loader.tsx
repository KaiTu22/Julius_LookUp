'use client';

import { useEffect } from 'react';

export default function FontAwesomeLoader() {
  useEffect(() => {
    console.log('FontAwesomeLoader useEffect running');

    // Check if already loaded
    if (document.querySelector('style[data-font-awesome="true"]')) {
      console.log('Font Awesome already loaded');
      return;
    }

    // Fetch and inject Font Awesome CSS
    fetch('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css')
      .then(res => res.text())
      .then(css => {
        const style = document.createElement('style');
        style.setAttribute('data-font-awesome', 'true');
        style.textContent = css;
        document.head.appendChild(style);
        console.log('Font Awesome CSS injected');
      })
      .catch(err => console.error('Failed to load Font Awesome:', err));
  }, []);

  return null;
}
