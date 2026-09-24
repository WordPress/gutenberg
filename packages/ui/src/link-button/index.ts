import { LinkButton as _LinkButton } from './link-button';
import { LinkButtonIcon } from './icon';

export type { LinkButtonProps, LinkButtonIconProps } from './types';

LinkButtonIcon.displayName = 'LinkButton.Icon';

/**
 * A link that looks like a `Button`. Prefer `Link` for navigation unless
 * button prominence is intentional.
 *
 * See the [Usage Guidelines](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-button-usage-guidelines--docs)
 * for when to use `Button`, `IconButton`, `Link`, or `LinkButton`.
 */
export const LinkButton = Object.assign( _LinkButton, {
	/**
	 * An icon component specifically designed to work well when rendered inside
	 * a `LinkButton` component.
	 */
	Icon: LinkButtonIcon,
} );
