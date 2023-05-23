/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useState } from '@wordpress/element';
import { 
    Button,
    __experimentalVStack as VStack,
    __experimentalSpacer as Spacer,
    __experimentalText as Text,
    __experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';


/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import LibraryFontVariant from './library-font-variant';


function LibraryFontDetails ({ font, handleUnselectFont }) {

    const { uninstallFont } = useContext( FontLibraryContext );
    const [ isConfirmOpen, setIsConfirmOpen ] = useState( false );
    const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );


    const fontFaces = ( font.fontFace && font.fontFace.length )
        ? font.fontFace
        : [ { fontFamily: font.fontFamily, fontStyle: 'normal', fontWeight: '400' } ];
    
    const handleConfirmUninstall = async () => {
        try {
            await uninstallFont( font );
            createSuccessNotice( __(`${font?.name || font.fontFamily} was uninstalled.`), { type: 'snackbar' } );
        } catch (e) {
            createErrorNotice( __(`Error deleting font. ${font?.name || font.fontFamily} could not be uninstalled.`), { type: 'snackbar' } );
        }
        handleUnselectFont();
    }

    const handleUninstallClick = async () => {
        setIsConfirmOpen( true );
    };

    const handleCancelUninstall = () => {
        setIsConfirmOpen( false );
    };

    return (
        <>
            <ConfirmDialog
                isOpen={ isConfirmOpen }
                cancelButtonText={ __( "No, keep the font" ) }
                confirmButtonText={ __( "Yes, uninstall" ) }
                onCancel={ handleCancelUninstall }
                onConfirm={ handleConfirmUninstall }
            >
                { __( `Would you like to remove ${font.name || font.fontFamily} and all its variants and assets?`) }
            </ConfirmDialog>
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
                        onClick={ handleUninstallClick }
                    >
                        { __("Delete permanently") }
                    </Button>
                </aside>

            </div>
        </>
    );
}

export default LibraryFontDetails;
