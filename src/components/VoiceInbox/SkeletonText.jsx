import React from 'react';
import './SkeletonText.css';

/**
 * A reusable skeletal loading component for text lines.
 * @param {number} lines - The number of lines to display (default: 5)
 */
const SkeletonText = ({ lines = 5 }) => {
  // Array of varied widths to make the text skeleton look realistic
  const widths = ['100%', '92%', '96%', '88%', '45%'];
  
  return (
    <div className="skeleton-text-container">
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton-line" 
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
};

export default SkeletonText;
