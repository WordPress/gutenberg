/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	googleVariantToFullVariant,
} from './utils';
import { FontLibraryContext } from './context';
import { getWeightFromGoogleVariant, getStyleFromGoogleVariant } from './utils';
import FontVariant from './font-variant';


function GoogleFontVariant ({ font, variantName }) {

    const { installedFontNames, libraryFonts } = useContext( FontLibraryContext );

    const style = getStyleFromGoogleVariant( variantName );
    const weight = getWeightFromGoogleVariant( variantName );
    const displayVariantName = googleVariantToFullVariant( variantName );

    const isIstalled = () => {
        const isFontInstalled = installedFontNames.has( font.family );
        if ( ! isFontInstalled ) {
            return false;
        }
        const libraryFont = libraryFonts.find(libFont => libFont.name === font.family || libFont.name === font.family );
        return !!libraryFont?.fontFace.find( face => face.fontStyle === style && face.fontWeight === weight );
    }

    return (
        <FontVariant
            variantName={ displayVariantName }
            checked={ isIstalled() }
        />
    );
}

export default GoogleFontVariant;
