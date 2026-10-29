import { Button as _Button } from './button';
import { ButtonCaret } from './caret';
import { ButtonIcon } from './icon';

ButtonIcon.displayName = 'Button.Icon';
ButtonCaret.displayName = 'Button.Caret';

/**
 * A versatile button component with multiple variants, tones, and sizes.
 *
 * See the [Usage Guidelines](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-button-usage-guidelines--docs)
 * for when to use `Button`, `IconButton`, `Link`, or `ButtonLink`.
 */
export const Button = Object.assign( _Button, {
	/**
	 * An icon component specifically designed to work well when rendered inside
	 * a `Button` component.
	 */
	Icon: ButtonIcon,
	/**
	 * A caret placed after the label of a `Button` that opens a menu, popover,
	 * or listbox. It matches the caret in the `Select` trigger.
	 */
	Caret: ButtonCaret,
} );
