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

const AVATAR_BACKGROUND_COLORS = [
	'#9601FF',
	'#CB0066',
	'#9F5407',
	'#BC00AD',
	'#5E6E0C',
	'#317268',
	'#007188',
];

const AVATAR_BACKGROUND_DARK_COLORS = [
	'#8100DE',
	'#B00059',
	'#894806',
	'#A30096',
	'#515F0A',
	'#2A6259',
	'#006175',
];

/**
 * Gets the colors for an avatar based on the user ID.
 *
 * @param userId - The user ID.
 * @return The border color, background color, and background dark color.
 */
export function getAvatarBorderColor( userId: number ): string {
	return AVATAR_BORDER_COLORS[ userId % AVATAR_BORDER_COLORS.length ];
}

export function getAvatarBackgroundColor( userId: number ): string {
	return AVATAR_BACKGROUND_COLORS[ userId % AVATAR_BACKGROUND_COLORS.length ];
}

export function getAvatarBackgroundDarkColor( userId: number ): string {
	return AVATAR_BACKGROUND_DARK_COLORS[
		userId % AVATAR_BACKGROUND_DARK_COLORS.length
	];
}
