/**
 * Internal dependencies
 */
import keyboardShortcut, {
	ALT,
	CONTROL,
	SHIFT,
} from 'utils/keyboard-shortcut';

export default {
	toggleEditorMode: {
		value: 'mod+shift+alt+m',
		label: keyboardShortcut(CONTROL, SHIFT, ALT, 'M'),
	},
};
