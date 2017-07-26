import addContainer from './addContainer';
import clear from './clear';
import domReady from '../../domReady/src/';
import filterMessage from './filterMessage';

let containerPolite, containerAssertive = '';

/**
 * Create the live regions.
 */
const setup = function() {
  containerPolite = document.getElementById( 'a11y-speak-polite' );
  containerAssertive = document.getElementById( 'a11y-speak-assertive' );

  if ( containerPolite === null ) {
    containerPolite = addContainer( 'polite' );
  }
  if ( containerAssertive === null ) {
    containerAssertive = addContainer( 'assertive' );
  }
};

/**
 * Run setup on domReady.
 */
domReady( setup );

/**
 * Update the ARIA live notification area text node.
 *
 * @param {String} message  The message to be announced by Assistive Technologies.
 * @param {String} ariaLive Optional. The politeness level for aria-live. Possible values:
 *                          polite or assertive. Default polite.
 */
export const speak = function( message, ariaLive ) {
  // Clear previous messages to allow repeated strings being read out.
  clear();

  message = filterMessage( message );

  if ( containerAssertive && 'assertive' === ariaLive ) {
    containerAssertive.textContent = message;
  } else if ( containerPolite ) {
    containerPolite.textContent = message;
  }
};
