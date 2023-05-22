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
    __experimentalHeading as Heading,
    __experimentalText as Text,
    __experimentalGrid as Grid,
} from '@wordpress/components';


/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import LibraryFontVariant from './library-font-variant';


function LibraryFontDetails ({ font }) {

    const { toggleInstallFont } = useContext( FontLibraryContext );

    const fontFaces = ( font.fontFace && font.fontFace.length )
        ? font.fontFace
        : [ { fontFamily: font.fontFamily, fontStyle: 'normal', fontWeight: '400' } ];
    
    return (
        <div className="font-library-modal__font_details">
            <main>
                <VStack spacing={ 4 }>
                    <Spacer margin={ 8 } />
                    { fontFaces.map( ( face, i ) => (
                        <LibraryFontVariant
                            font={ font }
                            face={ face }
                            key={`face${i}`}
                        />
                    ) ) }
                </VStack>
            </main>

            <aside>
                <VStack spacing={ 1 }>
                    <Text>{ font.fontFamily }</Text>
                </VStack>


                <Button
                    variant='tetriary'
                    onClick={ () => toggleInstallFont( font.name ) }
                >
                    { __("Delete permanently") }
                </Button>
            </aside>

        </div>
    );
}

export default LibraryFontDetails;
