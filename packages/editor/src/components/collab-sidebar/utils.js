/**
 * Sanitizes a comment string by removing non-printable ASCII characters.
 *
 * @param {string} str - The comment string to sanitize.
 * @return {string} - The sanitized comment string.
 */
export function sanitizeCommentString( str ) {
	return str.trim();
}

/**
 * These colors are picked from the WordPress.org design library.
 * @see https://www.figma.com/design/HOJTpCFfa3tR0EccUlu0CM/WordPress.org-Design-Library?node-id=1-2193&t=M6WdRvTpt0mh8n6T-1
 */
const AVATAR_BORDER_COLORS = [
	'#3858E9', // Blueberry
	'#9fB1FF', // Blueberry 2
	'#1D35B4', // Dark Blueberry
	'#1A1919', // Charcoal 0
	'#E26F56', // Pomegranate
	'#33F078', // Acid Green
	'#FFF972', // Lemon
	'#7A00DF', // Purple
];

/**
 * Gets the border color for an avatar based on the user ID.
 *
 * @param {number} userId - The user ID.
 * @return {string} - The border color.
 */
export function getAvatarBorderColor( userId ) {
	return AVATAR_BORDER_COLORS[ userId % AVATAR_BORDER_COLORS.length ];
}
