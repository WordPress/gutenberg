/**
 * Internal dependencies
 */
import { GOOGLE_FONT_FALLBACKS } from './constants';


/**
 * Receives a theme.json like FontFamily object and outputs a font object for a FontCard component.
 *
 * @param {object} fontFamily a theme.json like FontFamily object
 * @return {object} font objected used by FontCard component.
 */
export function fontFamilyToCardFont ( fontFamily, isActive = false ) {
    return {
        name: fontFamily.name || fontFamily.fontFamily,
        family: fontFamily.fontFamily,
        variantsCount: fontFamily.fontFace?.length || 1,
        asset: fontFamily.fontFace?.[ 0 ]?.src,
        isActive,
    };
}

/**
 * Receives a Google Font api font  object and outputs a font object for a FontCard component.
 *
 * @param {object} googleFont a Google Font api font object
 * @return {object} font objected used by FontCard component.
 */
export function googleFontToCardFont ( googleFont ) {
    return {
        name: googleFont.family,
        family: googleFont.family,
        variantsCount: googleFont.variants?.length || 1,
        asset: googleFont.files?.regular || googleFont.files?.[ Object.keys( googleFont.files )[ 0 ] ],
    };
}

/**
 * Receives a Google font variant name and outputs a full variant name with the font weight and style.
 * 
 * @param {string} variantName a Google font variant name
 * @return {string} a full variant name with the font weight and style.
 *  
 * @example
 * googleVariantToFullVariant( "500italic" ) // "Italic 500"
 */
export function googleVariantToFullVariant ( variant ) {
    const weight = getWeightFromGoogleVariant( variant );
    const style = variant.includes( "italic" ) ? "Italic" : "Normal";
    return `${ style } ${ weight }`;
}

export function getStyleFromGoogleVariant( variant ) {
	return variant.includes( 'italic' ) ? 'italic' : 'normal';
}

export function getWeightFromGoogleVariant( variant ) {
	return variant === 'regular' || variant === 'italic'
		? '400'
		: variant.replace( 'italic', '' );
}

function getFallbackForGoogleFont ( googleFontCategory ) {
    return GOOGLE_FONT_FALLBACKS[ googleFontCategory ] || "system-ui";
}

/**
* Get the font definitions for a Google font family
* @param {Object} googleFont font family object as defined by Google Fonts API
* @param {string[]} variantsSelected array of variant names selected
* @return {Object[]} array of font definitions
*/
export function fontFamilyFromGoogleFont ( googleFont, variantsSelected=[] ) {
    const fontFamily = {
        name: googleFont.family,
        fontFamily: `${googleFont.family}, ${ getFallbackForGoogleFont( googleFont.category ) }`,
        fontFace: googleFont.variants
            .filter(variant  => (
                !variantsSelected.length ? true : variantsSelected.includes( variant )
            ))
            .map( variant => (
                {
                    src: googleFont.files?.[ variant ],
                    fontWeight: getWeightFromGoogleVariant( variant ),
                    fontStyle: getStyleFromGoogleVariant( variant ),
                }
        ) ),
    };
    return fontFamily;
}

export function getFontFamilyFromGoogleFont ( font ) {
    return {
        name: font.family,
        fontFamily: `${font.family}, ${ getFallbackForGoogleFont( font.category ) }`,
        slug: font.family.replace( /\s+/g, '-' ).toLowerCase(),
        fontFace: font.variants.map( variant => (
            {
                src: font.files?.[ variant ],
                fontWeight: getWeightFromGoogleVariant( variant ),
                fontStyle: getStyleFromGoogleVariant( variant ),
            }
        ) ),
    };
}