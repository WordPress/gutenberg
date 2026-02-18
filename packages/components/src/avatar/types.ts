import type { IconType } from '../icon';

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
	 * Whether to show the hover-expand badge that reveals the user's
	 * name (or `label`) on hover. Requires `name` to be set.
	 *
	 * @default false
	 */
	badge?: boolean;
	/**
	 * Size of the avatar.
	 *
	 * - `'default'`: 32px
	 * - `'small'`: 24px
	 *
	 * @default 'default'
	 */
	size?: 'default' | 'small';
	/**
	 * CSS color value for an accent border ring around the avatar.
	 *
	 * When not provided, no border is rendered and the hover badge
	 * and avatar status uses the admin theme color as its background.
	 */
	borderColor?: string;
	/**
	 * A status string applied to the avatar. When set, the image is
	 * dimmed to indicate a non-default state. A corresponding
	 * `is-{status}` class is added for custom styling.
	 */
	status?: string;
	/**
	 * An icon or custom component rendered as a centered overlay on the
	 * avatar image. Only visible when `status` is set.
	 *
	 * Accepts any value supported by the `Icon` component: an icon from
	 * `@wordpress/icons`, a Dashicon name string, a component, or a
	 * JSX element.
	 */
	statusIndicator?: IconType | null;
};
