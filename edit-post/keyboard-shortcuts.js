/**
 * Internal dependencies
 */
import { tertiaryKeyCode, tertiaryShortcut } from 'utils/keycodes';

console.log(tertiaryKeyCode( 'm' ));
export default {
	toggleEditorMode: {
		value: tertiaryKeyCode( 'm' ),
		label: tertiaryShortcut( 'M' ),
	},
};
