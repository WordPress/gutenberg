/**
 * These colors are picked from the WordPress.org design library.
 *
 * @see https://www.figma.com/design/HOJTpCFfa3tR0EccUlu0CM/WordPress.org-Design-Library?node-id=1-2193&t=M6WdRvTpt0mh8n6T-1
 */
const AVATAR_BORDER_COLORS = [
	'#C36EFF',
	'#FF51A8',
	'#E4780A',
	'#FF35EE',
	'#879F11',
	'#46A494',
	'#00A2C3',
];

/**
 * Gets the border color for an avatar based on the user ID.
 *
 * @param userId - The user ID.
 * @return The border color.
 */
export function getAvatarBorderColor( userId: number ): string {
	return AVATAR_BORDER_COLORS[ userId % AVATAR_BORDER_COLORS.length ];
}
