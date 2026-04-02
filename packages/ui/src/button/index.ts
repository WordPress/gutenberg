import { Button as ButtonButton } from './button';
import { ButtonIcon } from './icon';

/**
 * A versatile button component with multiple variants, tones, and sizes.
 * Built on design tokens for consistent theming and accessibility.
 */
export const Button = Object.assign( ButtonButton, {
	/**
	 * An icon component specifically designed to work well when rendered inside
	 * a `Button` component.
	 */
	Icon: ButtonIcon,
} ) as typeof ButtonButton & {
	Icon: typeof ButtonIcon;
};
