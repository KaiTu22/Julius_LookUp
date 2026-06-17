'use client';

console.log('FontAwesomeLoader component loaded');

import { useEffect } from 'react';

export default function FontAwesomeLoader() {
  console.log('FontAwesomeLoader rendering');

  useEffect(() => {
    console.log('FontAwesomeLoader useEffect running');

    // Fetch and inject Font Awesome CSS
    fetch('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css')
      .then(res => res.text())
      .then(css => {
        const style = document.createElement('style');
        style.setAttribute('data-font-awesome', 'true');
        style.textContent = css;
        document.head.appendChild(style);
        console.log('Font Awesome CSS injected successfully');
      })
      .catch(err => console.error('Failed to load Font Awesome:', err));
  }, []);

  return null;
}
