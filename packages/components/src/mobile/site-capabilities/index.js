/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

export function isMentionsSupported( capabilities ) {
	return capabilities.mentions === true;
}

export const SiteCapabilitiesContext = createContext( {} );
