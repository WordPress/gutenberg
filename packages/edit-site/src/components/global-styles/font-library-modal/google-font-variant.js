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


function GoogleFontVariant ({ font, fontFace, toggleAddFont, isFontAdded }) {
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
