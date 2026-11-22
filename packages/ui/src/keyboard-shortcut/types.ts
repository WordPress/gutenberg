import type { WPKeycodeModifier } from '@wordpress/keycodes';
import type { ComponentProps } from '../utils/types';

export interface KeyboardShortcutProps extends ComponentProps< 'kbd' > {
	/**
	 * The character or group of keys and its optional platform-aware modifier.
	 */
	keyCombination: {
		character: string | string[];
		modifier?: WPKeycodeModifier;
	};
	/**
	 * Readable text for a key sequence that the keycodes formatter cannot
	 * describe, such as "Left bracket twice" or "Arrow keys".
	 */
	label?: string;
	/**
	 * CSS class applied to each visual keycap.
	 */
	keyClassName?: string;
}
