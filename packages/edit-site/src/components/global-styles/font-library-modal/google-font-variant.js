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


function GoogleFontVariant ({ font, fontFace }) {
    const { installedFontNames, libraryFonts } = useContext( FontLibraryContext );

    const isIstalled = () => {
        const isFontInstalled = installedFontNames.has( font.name );
        if ( ! isFontInstalled ) {
            return false;
        }
        const libraryFont = libraryFonts.find( libFont => libFont.name === font.family || libFont.name === font.family );
        return !!libraryFont?.fontFace.find( face => face.fontStyle === fontFace.fontStyle && face.fontWeight === fontFace.fontWeight );
    }

    return (
        <FontVariant
            fontFace={ fontFace }         
            checked={ isIstalled() }
        />
    );
}

export default GoogleFontVariant;
