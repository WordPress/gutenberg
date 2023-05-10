/**
 * Receives a theme.json like FontFamily object and outputs a font object for a FontCard component.
 *
 * @param {object} fontFamily a theme.json like FontFamily object
 * @return {object} font objected used by FontCard component.
 */
export function fontFamilyToCardFont ( fontFamily ) {
    return {
        name: fontFamily.name,
        family: fontFamily.fontFamily,
        variantsCount: fontFamily.fontFace?.length || 1,
        asset: fontFamily.fontFace?.[ 0 ]?.src,
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
 * googleVariantToFullVariant( "regular" ) // "Regular 400"
 * googleVariantToFullVariant( "italic" ) // "Italic 400"
 * googleVariantToFullVariant( "500" ) // "Regular 500"
 * googleVariantToFullVariant( "500italic" ) // "Italic 500"
 */
export function googleVariantToFullVariant ( variantName ) {
    const weight = ( variantName === "italic" || variantName === "regular")
        ? "400"
        : variantName.replace( "italic", "" );
    const style = variantName.includes( "italic" ) ? "Italic" : "Normal";
    return `${ style } ${ weight }`;
}