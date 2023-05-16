/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
    __experimentalText as Text,
} from '@wordpress/components';
import { useContext, useEffect, useState, useRef } from '@wordpress/element';


/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';


function FontFaceDemo ( { fontFace, style={} } ) {

    console.log("fontFace::::", fontFace);
    const ref = useRef(null);
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [ isAssetLoaded, setIsAssetLoaded ] = useState( false );
    const { demoText, loadFontFaceAsset } = useContext( FontLibraryContext );
    const { fontFamily, fontStyle, fontWeight } = fontFace;

    const demoStyle = {
        fontWeight,
        fontStyle,
        fontFamily,
        fontSize: 'large',
        opacity: isAssetLoaded ? '1' : '0',
        transition: 'opacity 0.3s ease-in-out',
        ...style,
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
          ( [ entry ] ) => {
            setIsIntersecting( entry.isIntersecting );
          },
          { }
        );
        observer.observe(ref.current);
        return () => observer.disconnect();
      }, [ref]);
    
    useEffect( () => {
        const loadAsset = async () => {
            if ( isIntersecting ) {
                await loadFontFaceAsset( fontFace );
                setIsAssetLoaded( true );
            }
        }
        loadAsset();
    }, [ fontFace, isIntersecting ] );

    return (
        <Text style={ demoStyle } ref={ref}>{ demoText }</Text>
    );
}

export default FontFaceDemo;
