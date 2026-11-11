/**
 * Extract complete first and last initials without interpreting name structure.
 *
 * @param name   The person's display name.
 * @param locale The locale for segmentation and casing.
 */
export function getInitials( name: string, locale?: string ): string[] {
	const segmenter = new Intl.Segmenter( locale, { granularity: 'grapheme' } );
	const words = ( name ?? '' )
		.trim()
		.split( /\s+/ )
		.map( ( word ) =>
			Array.from( segmenter.segment( word ) ).find( ( { segment } ) =>
				// Check visibility without removing joiners from complete emoji.
				segment.replace(
					/[\p{C}\p{Z}\p{Default_Ignorable_Code_Point}]/gu,
					''
				)
			)
		)
		.filter( ( word ) => word !== undefined );

	return words
		.filter( ( _, index ) => index === 0 || index === words.length - 1 )
		.map(
			( word ) =>
				// Casing can expand a character; keep one complete initial per word.
				segmenter
					.segment( word.segment.toLocaleUpperCase( locale ) )
					.containing( 0 )!.segment
		);
}
