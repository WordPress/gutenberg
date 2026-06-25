import { LinkButton as _LinkButton } from './link-button';
import { LinkButtonIcon } from './icon';

export type { LinkButtonProps, LinkButtonIconProps } from './types';

LinkButtonIcon.displayName = 'LinkButton.Icon';

/**
 * A link that looks like a `Button`. Prefer `Link` for navigation unless
 * button prominence is intentional.
 */
export const LinkButton = Object.assign( _LinkButton, {
	/**
	 * An icon component specifically designed to work well when rendered inside
	 * a `LinkButton` component.
	 */
	Icon: LinkButtonIcon,
} );
