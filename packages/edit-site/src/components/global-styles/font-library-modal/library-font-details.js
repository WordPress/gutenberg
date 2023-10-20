/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import LibraryFontVariant from './library-font-variant';
import { sortFontFaces } from './utils/sort-font-faces';

function LibraryFontDetails( { font } ) {
	const fontFaces =
		font.fontFace && font.fontFace.length
			? sortFontFaces( font.fontFace )
			: [
					{
						fontFamily: font.fontFamily,
						fontStyle: 'normal',
						fontWeight: '400',
					},
			  ];

	return (
		<>
			<Spacer margin={ 4 } />
			<VStack spacing={ 0 }>
				<Spacer margin={ 8 } />
				{ fontFaces.map( ( face, i ) => (
					<LibraryFontVariant
						font={ font }
						face={ face }
						key={ `face${ i }` }
					/>
				) ) }
			</VStack>
			<Spacer margin={ 8 } />
		</>
	);
}

export default LibraryFontDetails;
