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

    const isIstalled = font?.fontFace
        ? isFontActivated( font.name, face.fontStyle, face.fontWeight )
        : isFontActivated( font.name );

    const handleToggleActivation = () => {
        if ( font?.fontFace ) {
            toggleActivateFont( font.name, face.fontStyle, face.fontWeight );
            return;
        }
        toggleActivateFont( font.name );
    }
    
    return (
        <FontVariant
            fontFace={ face }
            checked={ isIstalled }
            onClick={ handleToggleActivation }
        />
    );
}

export default LibraryFontVariant;
