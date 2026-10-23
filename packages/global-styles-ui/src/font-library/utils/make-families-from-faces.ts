import type { FontFamily, FontFace } from '@wordpress/core-data';
import { kebabCase } from '@wordpress/kebab-case';
import { createCssString } from './create-css-string';

export default function makeFamiliesFromFaces(
	fontFaces: FontFace[]
): FontFamily[] {
	const fontFamiliesObject = fontFaces.reduce(
		( acc: Record< string, FontFamily >, item: FontFace ) => {
			// The REST API expects CSS text. The name from the font file is plain text.
			const fontFamily = createCssString( item.fontFamily );
			if ( ! acc[ item.fontFamily ] ) {
				acc[ item.fontFamily ] = {
					name: item.fontFamily,
					fontFamily,
					slug: kebabCase( item.fontFamily.toLowerCase() ),
					fontFace: [],
				};
			}
			// @ts-expect-error `acc[ item.fontFamily ]` is possibly `undefined`.
			acc[ item.fontFamily ].fontFace.push( { ...item, fontFamily } );
			return acc;
		},
		{}
	);
	return Object.values( fontFamiliesObject ) as FontFamily[];
}
