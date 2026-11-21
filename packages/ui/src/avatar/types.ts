import type { Avatar as _Avatar } from '@base-ui/react/avatar';
import type { ComponentProps } from '../utils/types';

export type AvatarProps = Omit<
	ComponentProps< typeof _Avatar.Root >,
	'color'
> & {
	/**
	 * The person's display name, used for initials and the default accessible label.
	 * Initials use the first complete character of the first and last
	 * whitespace-separated words. Single-word names show one larger initial.
	 * Invisible characters are skipped.
	 * Names without displayable characters leave the fallback empty and warn
	 * during development.
	 */
	name: string;
	/**
	 * The URL of the profile image. Initials appear if the image is unavailable.
	 */
	src?: React.ComponentProps< typeof _Avatar.Image >[ 'src' ];
	/**
	 * The CORS setting for the profile image request.
	 */
	crossOrigin?: React.ComponentProps< 'img' >[ 'crossOrigin' ];
	/**
	 * Locale used for character segmentation and uppercase conversion.
	 * Defaults to the runtime's locale.
	 */
	locale?: string;
	/**
	 * Sets the active ring color. The opaque fallback fill lightens or darkens
	 * that color to contrast with the ring, and the initials use a contrasting tint.
	 * When active, choose a color that contrasts with the surrounding surface.
	 * Accepts CSS colors and variables that resolve to a color. Do not use
	 * `currentColor`, including through variables, or CSS-wide keywords such as
	 * `inherit`. Unusable colors use neutral defaults.
	 */
	color?: React.CSSProperties[ 'color' ];
	/**
	 * Whether to display the activity ring. This is a visual indication only;
	 * consumers supply any activity descriptions or announcements.
	 * Does not indicate keyboard focus, hover, or selection.
	 *
	 * @default false
	 */
	active?: boolean;
	/**
	 * The intended image size on high-DPI screens. The outer footprint also
	 * reserves room for the activity ring. It remains constant across display
	 * densities and activity states; the image adjusts
	 * to the theme's focus-ring width within that space.
	 *
	 * @default "md"
	 */
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	/**
	 * The shape of the image and activity ring. Square images use the theme's
	 * corner radius for buttons and controls.
	 *
	 * @default "circle"
	 */
	shape?: 'circle' | 'square';
};
