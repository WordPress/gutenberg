/**
 * Specify a function to execute when the DOM is fully loaded.
 *
 * @param {Function} callback A function to execute after the DOM is ready.
 *
 * @returns {void}
 */
const domReady = function( callback ) {
  if ( document.readyState === 'complete' || ( document.readyState !== 'loading' && !document.documentElement.doScroll ) ) {
    return callback();
  }

  document.addEventListener( 'DOMContentLoaded', callback );
};

export default domReady;
