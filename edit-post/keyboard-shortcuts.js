/**
 * WordPress dependencies
 */
import { keycodes } from '@wordpress/utils';

const { rawShortcut, displayShortcut } = keycodes;

export default {
	toggleEditorMode: {
		value: rawShortcut.secondary( 'm' ),
		label: displayShortcut.secondary( 'm' ),
	},
};
