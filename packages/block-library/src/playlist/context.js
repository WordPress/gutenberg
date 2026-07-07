/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

export const PlaylistContext = createContext( {
	currentTrackClientId: null,
	setCurrentTrackClientId: () => {},
} );
