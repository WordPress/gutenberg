/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import type { FontFamily } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import type { FontFaceMetadata } from '../upload-fonts';

const { kebabCase } = unlock( componentsPrivateApis );

export default function makeFamiliesFromFaces(
	fontFaces: FontFaceMetadata[]
): FontFamily[] {
	const fontFamiliesObject = new Map< string, FontFamily >();
	for ( const item of fontFaces ) {
		if ( fontFamiliesObject.has( item.fontFamily ) ) {
			fontFamiliesObject.get( item.fontFamily )!.fontFace!.push( item );
		}

		fontFamiliesObject.set( item.fontFamily, {
			name: item.name,
			fontFamily: item.fontFamily,
			slug: kebabCase( item.fontFamily.toLowerCase() ),
			fontFace: [],
		} );
	}
	return Object.values( fontFamiliesObject ) as FontFamily[];
}
