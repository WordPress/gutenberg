/**
 * WordPress dependencies
 */
import { rawShortcut, displayShortcut } from '@wordpress/keycodes';

export default {
	toggleEditorMode: {
		raw: rawShortcut.secondary( 'm' ),
		display: displayShortcut.secondary( 'm' ),
	},
	toggleSidebar: {
		raw: rawShortcut.primary( ',' ),
		display: displayShortcut.primary( ',' ),
	},
};
