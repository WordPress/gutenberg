/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	CheckboxControl,
} from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DEMO_TEXT } from './constants';
import {
	googleVariantToFullVariant,
} from './utils';
import { FontLibraryContext } from './context';
import { getWeightFromGoogleVariant, getStyleFromGoogleVariant } from './utils';


function GoogleFontVariant ({ font, variantName }) {

    const { installedFontNames, libraryFonts } = useContext( FontLibraryContext );

    const style = getStyleFromGoogleVariant( variantName );
    const weight = getWeightFromGoogleVariant( variantName );

    const isIstalled = () => {
        const isFontInstalled = installedFontNames.has( font.family );
        if ( ! isFontInstalled ) {
            return false;
        }
        const libraryFont = libraryFonts.find(libFont => libFont.name === font.family || libFont.name === font.family );
        return !!libraryFont?.fontFace.find( face => face.fontStyle === style && face.fontWeight === weight );
    }

    return (
        <HStack spacing={ 2 } justify="flex-start">
            <CheckboxControl checked={ isIstalled() } />
            <VStack spacing={ 2 }>
                <Heading level={ 5 }>
                    { googleVariantToFullVariant(
                        variantName
                    ) }
                </Heading>
                <Text>{ DEMO_TEXT }</Text>
            </VStack>
        </HStack>
    );
}

export default GoogleFontVariant;
