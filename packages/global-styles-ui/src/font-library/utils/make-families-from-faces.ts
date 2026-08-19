import { kebabCase } from '@wordpress/kebab-case';
import { createCssString } from './create-css-string';
import type { FontFileMetadata, FontFamilyToUpload } from '../types';

export default function makeFamiliesFromFaces(
	faces: FontFileMetadata[]
): FontFamilyToUpload[] {
	const fontFamiliesObject = faces.reduce(
		(
			acc: Record<
				string,
				FontFamilyToUpload & {
					fontFace: NonNullable< FontFamilyToUpload[ 'fontFace' ] >;
				}
			>,
			item: FontFileMetadata
		) => {
			const cssFontFamily = createCssString( item.fontDisplayName );
			if ( ! acc[ item.fontDisplayName ] ) {
				acc[ item.fontDisplayName ] = {
					name: item.fontDisplayName,
					fontFamily: cssFontFamily,
					slug: kebabCase( item.fontDisplayName.toLowerCase() ),
					fontFace: [],
				};
			}
			acc[ item.fontDisplayName ].fontFace.push( {
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
