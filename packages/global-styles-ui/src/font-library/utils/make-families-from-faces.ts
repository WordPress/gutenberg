/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import type { FontFamily, FontFace } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { kebabCase } = unlock( componentsPrivateApis );

export default function makeFamiliesFromFaces(
	fontFaces: FontFace[]
): FontFamily[] {
	const fontFamiliesObject = fontFaces.reduce(
		( acc: Record< string, FontFamily >, item: FontFace ) => {
			if ( ! acc[ item.fontFamily ] ) {
				acc[ item.fontFamily ] = {
					name: item.fontFamily,
					fontFamily: item.fontFamily,
					slug: kebabCase( item.fontFamily.toLowerCase() ),
					fontFace: [],
				};
			}
			// @ts-expect-error
			acc[ item.fontFamily ].fontFace.push( item );
			return acc;
		},
		{}
	);
	return Object.values( fontFamiliesObject ) as FontFamily[];
}
