
const SHADOWS_REG = /,(?![^\(]*\))/
const SHADOW_PARTS_REG = /\s(?![^(]*\))/

export function parseShadowString(shadowStr) {
    try {
        const shadows = shadowStr.split(SHADOWS_REG).map(parseSingleShadow);
        return shadows.filter(shadow => !!shadow);
    } catch (error) {
        return [];
    }
}

function parseSingleShadow(shadow) {
    shadow  = shadow.trim();

    // check if the string is valid value for box-shadow
    // this will be extended to parse presets, but for now returning any invalid string
    const isValidShadow = CSS.supports('box-shadow', shadow);
    if ( !isValidShadow ) return null;
    
    const parts = shadow.split(SHADOW_PARTS_REG);
    // check if shadow had inset
    const inset = parts.includes('inset');
    // check for the color right to left as per the CSS spec
    const color = parts.reverse().filter(p => CSS.supports('color', p)).shift()
    // remove inset and color to capture remaining values
    const [offsetX, offsetY, blur, spread] = parts.filter(p => p!=='inset' && p!==color).reverse()
    
    return {
        offsetX,
        offsetY,
        blur,
        spread,
        color,
        inset,
    }
}

export function getShadowString(shadows) {
    if ( !Array.isArray(shadows) ) return ''

    return shadows.map(shadow => {
        let str = `${shadow.offsetX || 0} ${shadow.offsetY || 0}`;
        str += shadow.blur ? ` ${shadow.blur}` : '';
        str += shadow.spread ? ` ${shadow.spread}` : '';
        str += shadow.color ? ` ${shadow.color}` : '';
        str += shadow.inset ? ` inset` : '';
        return str;
    }).join(', ')
}
