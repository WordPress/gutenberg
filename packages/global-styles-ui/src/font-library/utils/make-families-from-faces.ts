/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { normalizeCSSFontFaceFontFamily } from './index';
import type { FontFileMetadata, FontFamilyToUpload } from '../types';

const { kebabCase } = unlock( componentsPrivateApis );

export default function makeFamiliesFromFaces(
	faces: FontFileMetadata[]
): FontFamilyToUpload[] {
	const fontFamiliesObject = faces.reduce(
		(
			acc: Record< string, FontFamilyToUpload >,
			item: FontFileMetadata
		) => {
			const cssFontFamily = normalizeCSSFontFaceFontFamily(
				item.fontDisplayName
			);
			if ( ! acc[ item.fontDisplayName ] ) {
				acc[ item.fontDisplayName ] = {
					name: item.fontDisplayName,
					fontFamily: cssFontFamily,
					slug: kebabCase( item.fontDisplayName.toLowerCase() ),
					fontFace: [],
				};
			}
			acc[ item.fontDisplayName ].fontFace!.push( {
				fontFamily: cssFontFamily,
				fontStyle: item.fontStyle,
				fontWeight: item.fontWeight,
				file: item.file,
			} );
			return acc;
		},
		{}
	);
	return Object.values( fontFamiliesObject );
}
