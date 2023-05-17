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

    const { customFonts, toggleActivateFont } = useContext( FontLibraryContext );

    const isIstalled = () => {
        if ( font.shouldBeRemoved ) {
            return false;
        }
        const activeFont = customFonts.find( family => family.name === font.name );
        if ( ! activeFont ) {
            return false;
        }
        return !!activeFont?.fontFace.find( ff => ff.fontStyle === face.fontStyle && ff.fontWeight === face.fontWeight );
    }

    return (
        <FontVariant
            fontFace={ face }
            checked={ isIstalled() }
            onClick={ () => toggleActivateFont( font.name, face.fontStyle, face.fontWeight ) }
        />
    );
}

export default LibraryFontVariant;
