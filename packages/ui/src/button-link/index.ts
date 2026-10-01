import { ButtonLink as _ButtonLink } from './button-link';
import { ButtonLinkIcon } from './icon';

export type { ButtonLinkProps, ButtonLinkIconProps } from './types';

ButtonLinkIcon.displayName = 'ButtonLink.Icon';

/**
 * A link that looks like a `Button`. Prefer `Link` for navigation unless
 * button prominence is intentional.
 *
 * See the [Usage Guidelines](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-button-usage-guidelines--docs)
 * for when to use `Button`, `IconButton`, `Link`, or `ButtonLink`.
 */
export const ButtonLink = Object.assign( _ButtonLink, {
	/**
	 * An icon component specifically designed to work well when rendered inside
	 * a `ButtonLink` component.
	 */
	Icon: ButtonLinkIcon,
} );
