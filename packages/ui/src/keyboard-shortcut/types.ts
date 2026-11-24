import type { WPKeycodeModifier } from '@wordpress/keycodes';
import type { ComponentProps } from '../utils/types';

interface KeyboardShortcutBaseProps extends ComponentProps< 'kbd' > {
	/**
	 * CSS class applied to each visual keycap.
	 */
	keyClassName?: string;
}

export type KeyboardShortcutProps = KeyboardShortcutBaseProps &
	(
		| {
				/**
				 * A single key and its optional platform-aware modifier.
				 */
				keyCombination: {
					character: string;
					modifier?: WPKeycodeModifier;
				};
				/**
				 * Optional readable text overriding the keycodes formatter, such as
				 * "Left bracket twice".
				 */
				label?: string;
		  }
		| {
				/**
				 * A group of keys and its optional platform-aware modifier.
				 */
				keyCombination: {
					character: string[];
					modifier?: WPKeycodeModifier;
				};
				/**
				 * Required readable text describing the group, such as "Arrow keys".
				 */
				label: string;
		  }
	);
