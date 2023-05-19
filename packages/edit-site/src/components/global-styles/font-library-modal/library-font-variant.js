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


function LibraryFontVariant ({ face, font }) {

    const { isFontActivated, toggleActivateFont } = useContext( FontLibraryContext );

    const isIstalled = isFontActivated( font.name, face.fontStyle, face.fontWeight );
    
    return (
        <FontVariant
            fontFace={ face }
            checked={ isIstalled }
            onClick={ () => toggleActivateFont( font.name, face.fontStyle, face.fontWeight ) }
        />
    );
}

export default LibraryFontVariant;
