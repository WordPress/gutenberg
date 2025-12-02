/**
 * WordPress dependencies
 */
import type { FontFace, FontFamily } from '@wordpress/core-data';

export function getFontsOutline(
	fonts: FontFamily[]
): Record< string, Record< string, boolean > > {
	return fonts.reduce(
		( acc, font ) => ( {
			...acc,
			[ font.slug ]: ( font?.fontFace || [] ).reduce(
				( faces, face ) => ( {
					...faces,
					[ `${ face.fontStyle }-${ face.fontWeight }` ]: true,
				} ),
				{}
			),
		} ),
		{}
	);
}

export function isFontFontFaceInOutline(
	slug: string,
	face: FontFace | null,
	outline: Record< string, Record< string, boolean > >
): boolean {
	if ( ! face ) {
		return !! outline[ slug ];
	}
	return !! outline[ slug ]?.[ `${ face.fontStyle }-${ face.fontWeight }` ];
}
