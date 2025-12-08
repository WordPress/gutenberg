/**
 * Internal dependencies
 */
export { registerBlockAbilities } from './abilities';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import { registerBlockAbilities } from './abilities';

/**
 * Initialize AI Assistant when DOM is ready
 */
domReady( () => {
	// Only register abilities in block editor context
	if ( window.wp && window.wp.blockEditor ) {
		registerBlockAbilities().catch( ( error ) => {
			// eslint-disable-next-line no-console
			console.error(
				'Failed to register AI Assistant abilities:',
				error
			);
		} );
	}
} );
