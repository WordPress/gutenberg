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
    const { isFontInstalled, toggleInstallFont } = useContext( FontLibraryContext );
    const isInstalled = isFontInstalled( font.name, fontFace.fontStyle, fontFace.fontWeight );
    return (
        <FontVariant
            fontFace={ fontFace }         
            checked={ isInstalled }
            onClick={ () => toggleInstallFont( font.name, fontFace ) }
            onChange={ () => {} }
        />
    );
}

export default GoogleFontVariant;
