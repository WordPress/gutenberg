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
import CollectionFontVariant from './collection-font-variant';
import { isFontFontFaceInOutline } from './utils/fonts-outline';
import { sortFontFaces } from './utils/sort-font-faces';

function CollectionFontDetails( {
	font,
	handleToggleVariant,
	fontToInstallOutline,
} ) {
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
					<CollectionFontVariant
						font={ font }
						face={ face }
						key={ `face${ i }` }
						handleToggleVariant={ handleToggleVariant }
						selected={ isFontFontFaceInOutline(
							font.slug,
							font.fontFace ? face : null, // If the font has no fontFace, we want to check if the font is in the outline
							fontToInstallOutline
						) }
					/>
				) ) }
			</VStack>
			<Spacer margin={ 8 } />
		</>
	);
}

export default CollectionFontDetails;
