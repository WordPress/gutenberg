/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { makeSetupFunction } from './shared/index';
export { speak } from './shared/index';

/**
 * Create the live regions.
 */
export const setup = makeSetupFunction( __( 'Notifications' ) );

/**
 * Run setup on domReady.
 */
domReady( setup );
