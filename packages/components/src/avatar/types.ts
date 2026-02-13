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
	 * When not provided, a subtle gray border is used.
	 */
	borderColor?: string;
};
