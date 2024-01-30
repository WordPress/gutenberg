/**
 * Internal dependencies
 */
import FontCard from './font-card';

function CollectionFontCard( { font, onClick } ) {
	// Transform the shape of the data coming from font collection
	// into a format understood by the FontCard component and the install related functions.
	const fontFamily = {
		...font.font_family_settings,
		preview: font.preview,
		fontFace: font.font_faces.map( ( face ) => ( {
			...face.font_face_settings,
			preview: face.preview,
		} ) ),
	};

	return (
		<FontCard font={ fontFamily } onClick={ () => onClick( fontFamily ) } />
	);
}

export default CollectionFontCard;
