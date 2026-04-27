export type AvatarGroupProps = {
	/**
	 * Maximum number of avatars to display before showing an
	 * overflow indicator.
	 *
	 * @default 3
	 */
	max?: number;
	/**
	 * Avatar elements to display in the group.
	 */
	children: React.ReactNode;
};
