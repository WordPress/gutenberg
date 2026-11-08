import { _x } from '@wordpress/i18n';

/**
 * Avatar border colors chosen to be visually distinct from each other and from
 * the editor's semantic UI colors (Delta E > 10 between all pairs).
 */
const AVATAR_BORDER_COLORS = [
	'#6F42C1', // Purple
	'#D94145', // Red
	'#FBBF24', // Orange
	'#FF35EE', // Magenta
	'#879F11', // Olive
	'#0F766E', // Teal
	'#00CFFF', // Cyan
];

/**
 * Sanitizes a note string by trimming leading and trailing whitespace.
 *
 * @param str The note string to sanitize.
 * @return The sanitized note string.
 */
export function sanitizeNoteContent( str: string ): string {
	return str.trim();
}

/**
 * Gets the border color for an avatar based on the user ID.
 *
 * Always returns a 6-digit `#RRGGBB` hex string; callers (e.g. the highlight
 * styles) rely on this format to append alpha suffixes.
 *
 * @param userId The user ID.
 * @return The border color as a `#RRGGBB` hex string.
 */
export function getAvatarBorderColor( userId: number ): string {
	return AVATAR_BORDER_COLORS[ userId % AVATAR_BORDER_COLORS.length ];
}

/**
 * Generates a note excerpt from text based on word count type and length.
 *
 * @param text          The note text to generate excerpt from.
 * @param excerptLength The maximum length for the note excerpt.
 * @return The generated note excerpt.
 */
export function getNoteExcerpt(
	text: string | null | undefined,
	excerptLength = 10
): string {
	if ( ! text ) {
		return '';
	}

	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );

	const rawText = text.trim();
	let trimmedExcerpt = '';

	if ( wordCountType === 'words' ) {
		trimmedExcerpt = rawText.split( ' ', excerptLength ).join( ' ' );
	} else if ( wordCountType === 'characters_excluding_spaces' ) {
		/*
		 * 1. Split the text at the character limit,
		 * then join the substrings back into one string.
		 * 2. Count the number of spaces in the text
		 * by comparing the lengths of the string with and without spaces.
		 * 3. Add the number to the length of the visible excerpt,
		 * so that the spaces are excluded from the word count.
		 */
		const textWithSpaces = rawText.split( '', excerptLength ).join( '' );

		const numberOfSpaces =
			textWithSpaces.length - textWithSpaces.replaceAll( ' ', '' ).length;

		trimmedExcerpt = rawText
			.split( '', excerptLength + numberOfSpaces )
			.join( '' );
	} else if ( wordCountType === 'characters_including_spaces' ) {
		trimmedExcerpt = rawText.split( '', excerptLength ).join( '' );
	}

	const isTrimmed = trimmedExcerpt !== rawText;
	return isTrimmed ? trimmedExcerpt + '…' : trimmedExcerpt;
}
