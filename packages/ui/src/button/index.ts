import { Button as _Button } from './button';
import { ButtonIcon } from './icon';

ButtonIcon.displayName = 'Button.Icon';

/**
 * A versatile button component with multiple variants, tones, and sizes.
 */
export const Button = Object.assign( _Button, {
	/**
	 * An icon component specifically designed to work well when rendered inside
	 * a `Button` component.
	 */
	Icon: ButtonIcon,
} );
