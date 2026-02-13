export type AvatarProps = {
	/**
	 * URL of the avatar image.
	 *
	 * When not provided, a placeholder circle is rendered.
	 */
	src?: string;
	/**
	 * Name of the user. Used as an accessible label.
	 */
	name?: string;
	/**
	 * Diameter of the avatar in pixels.
	 *
	 * @default 32
	 */
	size?: number;
	/**
	 * CSS color value for an accent border ring around the avatar.
	 *
	 * When not provided, a subtle gray border is used.
	 */
	borderColor?: string;
};
