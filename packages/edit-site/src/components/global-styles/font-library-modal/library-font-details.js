/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useMemo } from '@wordpress/element';
import { 
    Button,
    __experimentalHStack as HStack,
    __experimentalVStack as VStack,
    __experimentalSpacer as Spacer,
} from '@wordpress/components';


/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import LibraryFontVariant from './library-font-variant';


function LibraryFontDetails ({ font }) {

    const fontFaces = ( font.fontFace && font.fontFace.length )
        ? font.fontFace
        : [ { fontFamily: font.name, fontStyle: 'normal', fontWeight: 'normal' } ];

    return (
        <>
            <Spacer margin={ 8 } />
            <VStack spacing={ 4 }>
                { fontFaces.map( ( face, i ) => (
                    <LibraryFontVariant
                        font={ font }
                        face={ face }
                        key={`face${i}`}
                    />
                ) ) }
            </VStack>
        </>
    );
}

export default LibraryFontDetails;
