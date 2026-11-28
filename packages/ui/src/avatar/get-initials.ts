/**
 * Extract complete first and last initials without interpreting name structure.
 *
 * @param name      The person's display name.
 * @param segmenter The reusable grapheme segmenter.
 * @param locale    The locale for uppercase conversion.
 */
export function getInitials(
	name: string,
	segmenter: Intl.Segmenter,
	locale?: string
): string[] {
	const words = ( name ?? '' )
		.trim()
		.split( /\s+/ )
		.map( ( word ) => {
			for ( const { segment } of segmenter.segment( word ) ) {
				// Keep joiners within a visible grapheme, including emoji.
				if (
					/[^\p{C}\p{Z}\p{Default_Ignorable_Code_Point}]/u.test(
						segment
					)
				) {
					return segment;
				}
			}
			return undefined;
		} )
		.filter( ( word ) => word !== undefined );

	return words
		.filter( ( _, index ) => index === 0 || index === words.length - 1 )
		.map(
			( word ) =>
				// Casing can expand a character; keep one complete initial per word.
				segmenter
					.segment( word.toLocaleUpperCase( locale ) )
					.containing( 0 )!.segment
		);
}
