/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import {
    Spinner,
    __experimentalHeading as Heading,
    __experimentalText as Text,
    __experimentalVStack as VStack,
    __experimentalHStack as HStack,
    __experimentalSpacer as Spacer,
    CheckboxControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';
import FontsGrid from './fonts-grid';
import FontCard from './font-card';
import { DEMO_TEXT } from './constants';
import { googleFontToCardFont, googleVariantToFullVariant } from './utils'; 

function GoogleFonts ({ googleFonts }) {

    const [ fontSelected, setFontSelected ] = useState( null );

    const handleSelectFont = ( name ) => {
        console.log( "handleSelectedFont", name );
        const font = googleFonts.find( ( font ) => font.family === name );
        setFontSelected( font );
    };

    const handleUnselectFont = () => {
        setFontSelected( null );
    }

    const fonts = useMemo( () => (
        googleFonts.map( googleFontToCardFont )
    ), [ googleFonts ] );

    const tabDescription = fontSelected ? __( `Select ${ fontSelected.family } variants you want to install` ) : __( "Select a font to install" );

     return (
        <TabLayout
            title={ fontSelected?.family || "" }
            description={ tabDescription }
            handleBack={ !!fontSelected && handleUnselectFont }
        >
            { fonts.length === 0 && (
                <Spinner />
            ) }

            { fonts.length > 0 && (
                <>
                    {!fontSelected && (
                        <FontsGrid>
                            { fonts.map( ( font ) => (
                                <FontCard
                                    font={ font }
                                    key={ font.name }
                                    onClick={ () => handleSelectFont( font.name ) }
                                />
                            ))}
                        </FontsGrid>
                    )}

                    <Spacer margin={8} />
                    
                    {fontSelected && (
                        <VStack spacing={4}>
                            { fontSelected.variants.map( ( variant ) => (
                                <HStack spacing={2} justify='flex-start'>
                                    <CheckboxControl />
                                    <VStack spacing={2}>
                                        <Heading level={ 5 }>{ googleVariantToFullVariant( variant ) }</Heading>
                                        <Text>{ DEMO_TEXT }</Text>
                                    </VStack>
                                </HStack>
                            ) ) }
                        </VStack>
                    )}
                </>
            ) }
		</TabLayout>
    );
}

export default GoogleFonts;
