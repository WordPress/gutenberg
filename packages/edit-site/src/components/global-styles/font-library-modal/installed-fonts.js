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
import SaveButton from '../../save-button';


function InstalledFonts () {
	const { installedFonts } = useContext( FontLibraryContext );
    const [ fontSelected, setFontSelected ] = useState( null );

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
                    {installedFonts.map( font => (
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
            <SaveButton />
        </HStack>
    );
}


export default InstalledFonts;
