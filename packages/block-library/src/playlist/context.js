/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

export const PlaylistContext = createContext( {
	currentTrackClientId: null,
	currentTrackData: undefined,
	showImages: true,
	waveformStyle: 'bars',
	onTrackEnded: () => {},
	setCurrentTrackClientId: () => {},
} );
