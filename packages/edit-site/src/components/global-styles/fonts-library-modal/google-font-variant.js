/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import FontVariant from './font-variant';

function GoogleFontVariant( { font, fontFace, toggleAddFont, isFontAdded } ) {
	const isAdded = isFontAdded( font, fontFace );
	return (
		<FontVariant
			fontFace={ fontFace }
			checked={ isAdded }
			onClick={ () => toggleAddFont( font, fontFace ) }
			onChange={ () => {} }
		/>
	);
}

export default GoogleFontVariant;
