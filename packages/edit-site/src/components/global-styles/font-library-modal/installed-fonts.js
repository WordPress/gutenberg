/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useMemo, useState } from '@wordpress/element';
import { 
    Button,
    __experimentalHStack as HStack,
} from '@wordpress/components';


/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';
import { FontLibraryContext } from './context';
import { fontFamilyToCardFont } from './utils';
import FontsGrid from './fonts-grid';
import LibraryFontCard from './library-font-card';
import LibraryFontDetails from './library-font-details';


function InstalledFonts () {
	const { installedFonts } = useContext( FontLibraryContext );
    const [ fontSelected, setFontSelected ] = useState( null );

    // const fonts = [
    //     ...libraryFonts.map( family => fontFamilyToCardFont( family, false ) ),
    //     ...themeFonts.map( family => fontFamilyToCardFont( family, true ) ),
    // ].sort( ( a, b ) => a.name.localeCompare( b.name ) );
    const fonts = useMemo(
        () => installedFonts.map( fontFamilyToCardFont ),
        [ installedFonts ]
    );

    const handleUnselectFont = () => {
        setFontSelected( null );
    };

    const handleSelectFont = ( name ) => {
        setFontSelected( name );
    };
    
    return (
        <TabLayout
            title={ fontSelected || '' }
            description={ __("Fonts installed in your WordPress, activate them to use in your site.") }
            handleBack={ !! fontSelected && handleUnselectFont }
            footer={<Footer />}
        >
            {!fontSelected && (
                <FontsGrid>
                    {fonts.map( font => (
                        <LibraryFontCard
                            font={ font }
                            key={ font.name }
                            onClick={ () => { handleSelectFont( font.name ) } }
                        />
                    ) )}
                </FontsGrid>
            )}

            {fontSelected && (
                <LibraryFontDetails fontName={ fontSelected } />
            )}
            

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
