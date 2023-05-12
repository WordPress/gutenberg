/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';
import { FontLibraryContext } from './context';
import FontCard from './font-card';
import { fontFamilyToCardFont } from './utils';
import FontsGrid from './fonts-grid';
import { 
    Button,
    CheckboxControl,
    __experimentalHStack as HStack,
} from '@wordpress/components';


function InstalledFonts () {

	const { fontLibrary, customFontFamilies } = useContext( FontLibraryContext );
    const fontFamilies = fontLibrary.fontFamilies || [];

    const fontLibraryFonts = fontFamilies.map( family => fontFamilyToCardFont( family, false ) );
    const customFonts = customFontFamilies.map( family => fontFamilyToCardFont( family, true ) );

    const fonts = fontLibraryFonts.concat( customFonts );
    

    console.log("fontLibrary", fontLibrary);
    console.log("fontFamilies", fontFamilies);
    console.log("fonts", fonts);

    return (
        <TabLayout
            description={ __("Fonts installed in your WordPress, activate them to use in your site.") }
            footer={<Footer />}
        >
            <FontsGrid>
                {fonts.map( font => (
                    <FontCard
                        key={ font.name }
                        font={font}
                        actionHandler={
                            <CheckboxControl checked={ font.isActive } onChange={ () => {} } />
                        }
                    />
                ) )}
            </FontsGrid>

        </TabLayout>
    );
}

function Footer() {
    return (
        <HStack justify="flex-end">
            <Button variant="tertiary">{ __("Cancel") }</Button>
            <Button variant="primary">{ __("Save") }</Button>
        </HStack>
    );
}


export default InstalledFonts;
