/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontCard from './font-card';
import { FontLibraryContext } from './context';

function LibraryFontCard( { font, ...props } ) {
	const { getFontFacesActivated } = useContext( FontLibraryContext );

	const variantsInstalled =
		font?.fontFace?.length > 0 ? font.fontFace.length : 1;
	const variantsActive = getFontFacesActivated(
		font.slug,
		font.source
	).length;
	const variantsText = sprintf(
		/* translators: 1: Active font variants, 2: Total font variants. */
		__( '%1$s/%2$s variants active' ),
		variantsActive,
		variantsInstalled
	);

	return (
		<FontCard font={ font } variantsText={ variantsText } { ...props } />
	);
}

export default LibraryFontCard;
