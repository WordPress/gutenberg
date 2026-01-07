/**
 * Internal dependencies
 */
import { Button as ButtonButton } from './button';
import { ButtonIcon } from './icon';

export const Button = Object.assign( ButtonButton, {
	Icon: ButtonIcon,
} ) as typeof ButtonButton & {
	Icon: typeof ButtonIcon;
};
