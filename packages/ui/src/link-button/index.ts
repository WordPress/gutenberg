import { LinkButton as _LinkButton } from './link-button';
import { ButtonIcon } from '../button/icon';

export type { LinkButtonProps, LinkButtonIconProps } from './types';

ButtonIcon.displayName = 'LinkButton.Icon';

/**
 * A link that looks like a `Button`, for navigation actions.
 */
export const LinkButton = Object.assign( _LinkButton, {
	/**
	 * An icon component specifically designed to work well when rendered inside
	 * a `LinkButton` component.
	 */
	Icon: ButtonIcon,
} );
