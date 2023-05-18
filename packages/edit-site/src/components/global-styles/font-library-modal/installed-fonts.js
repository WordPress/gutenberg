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
import FontsGrid from './fonts-grid';
import LibraryFontCard from './library-font-card';
import LibraryFontDetails from './library-font-details';
import SaveButton from '../../save-button';


function InstalledFonts () {
	const { installedFonts, customFonts } = useContext( FontLibraryContext );
    const [ fontSelected, setFontSelected ] = useState( null );

    const handleUnselectFont = () => {
        setFontSelected( null );
    };

    const handleSelectFont = ( font ) => {
        setFontSelected( font );
    };

    return (
        <TabLayout
            title={ fontSelected?.name || '' }
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
                            onClick={ () => { handleSelectFont( font ) } }
                        />
                    ) )}
                </FontsGrid>
            )}

            {fontSelected && (
                <LibraryFontDetails
                    font={ fontSelected }
                />
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
