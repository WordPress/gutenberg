import type { IconType } from '@wordpress/components';

export type AvatarProps = {
	/**
	 * URL of the avatar image.
	 *
	 * When not provided, initials derived from `name` are shown.
	 */
	src?: string;
	/**
	 * Name of the user. Used as an accessible label and to generate
	 * initials when no image is provided.
	 */
	name?: string;
	/**
	 * Visible text shown in the hover badge. When not provided, `name`
	 * is used instead. Use this to provide contextual labels like "You"
	 * without affecting the accessible name or initials.
	 */
	label?: string;
	/**
	 * Specifies the avatar's visual style treatment.
	 *
	 * - `'badge'`: Displays a hover-expand pill that reveals the user's
	 *   name (or `label`) on hover. Requires `name` to be set.
	 *
	 * Leave undefined for the default circular avatar.
	 */
	variant?: 'badge';
	/**
	 * Size of the avatar.
	 *
	 * - `'default'`: For standalone avatars and list items where the
	 *   avatar is a primary visual element (e.g. collaborator lists,
	 *   user profiles).
	 * - `'small'`: For inline or compact contexts where space is
	 *   limited (e.g. cursor labels, toolbars, badges alongside text).
	 *
	 * @default 'default'
	 */
	size?: 'default' | 'small';
	/**
	 * CSS color value for an accent border ring around the avatar.
	 *
	 * When not provided, no border is rendered and the hover badge
	 * uses the admin theme color as its background.
	 */
	borderColor?: string;
	/**
	 * Whether to dim the avatar to indicate an inactive or away state.
	 * When true, images are desaturated and faded, and initials are
	 * reduced in opacity.
	 *
	 * @default false
	 */
	dimmed?: boolean;
	/**
	 * An icon or custom component rendered as a centered overlay on the
	 * avatar image. Only visible when `dimmed` is true.
	 *
	 * Accepts any value supported by the `Icon` component: an icon from
	 * `@wordpress/icons`, a Dashicon name string, a component, or a
	 * JSX element.
	 */
	statusIndicator?: IconType | null;
};
