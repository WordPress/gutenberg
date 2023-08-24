/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import FontVariant from './font-variant';

function LibraryFontVariant( { face, font } ) {
	const { isFontActivated, toggleActivateFont } =
		useContext( FontLibraryContext );

	const isIstalled = font?.fontFace
		? isFontActivated( font.slug, face.fontStyle, face.fontWeight, font.source )
		: isFontActivated( font.slug, null, null, font.source );

	const handleToggleActivation = () => {
		if ( font?.fontFace ) {
			toggleActivateFont( font, face );
			return;
		}
		toggleActivateFont( font );
	};

	return (
		<FontVariant
			fontFace={ face }
			checked={ isIstalled }
			onClick={ handleToggleActivation }
		/>
	);
}

export default LibraryFontVariant;
