import ReactDOMServer from 'react-dom/server';

/**
 * Converts a React SVG component to a string representation
 * 
 * @param {React.ComponentType} Component - The SVG React component to convert
 * @returns {string|null} The SVG as a string or null if conversion fails
 */
export const svgToString = (Component) => {
  if (!Component) return null;
  
  try {
    // Use renderToStaticMarkup to avoid extra React attributes in output
    const svgString = ReactDOMServer.renderToStaticMarkup(<Component />);
    return svgString;
  } catch (error) {
    console.error('Error converting SVG component to string:', error);
    return null;
  }
};

/**
 * Checks if an SVG string is valid
 * 
 * @param {string} svgString - The SVG string to validate
 * @returns {boolean} True if the SVG is valid
 */
export const isValidSvg = (svgString) => {
  if (!svgString || typeof svgString !== 'string') return false;
  return svgString.startsWith('<svg') && svgString.endsWith('</svg>');
};
