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

    const tabDescription = !!fontSelected
        ?  __(`${fontSelected.name} variants.`)
        :  __("Fonts installed in your WordPress, activate them to use in your site."); 

    return (
        <TabLayout
            title={ fontSelected?.name || '' }
            description={ tabDescription }
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
                    handleUnselectFont={ handleUnselectFont }
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
