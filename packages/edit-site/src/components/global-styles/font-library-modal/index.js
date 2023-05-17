/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Modal,
    TabPanel,
    Button,
} from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontLibraryProvider, { FontLibraryContext } from './context';
import InstalledFonts from './installed-fonts';
import GoogleFonts from './google-fonts';
import LocalFonts from './local-fonts';
import { MODAL_TABS } from './constants';


function FontLibraryModal( { onRequestClose, initialTabName = "installed-fonts" }  ) {

    const { discardLibraryFontsChanges } = useContext( FontLibraryContext );

    const handleSelectTab = (tabName ) => {
        if( tabName != "google-fonts" ) {
            discardLibraryFontsChanges();
        }   
    }

    return (
        <Modal
            title={ __("Fonts Library") }
            onRequestClose={ onRequestClose }
            isFullScreen={ true }
        >
            <TabPanel
                className="fonts-library-panel"
                initialTabName={ initialTabName }
                tabs={ MODAL_TABS }
                onSelect={ handleSelectTab }
            >
                { ( tab ) => {  
                    switch ( tab.name ) {
                        case 'google-fonts':
                            return (
                                <GoogleFonts />
                            );
                        case 'local-fonts':
                            return (
                                <LocalFonts />
                            );
                        case 'installed-fonts':
                        default:
                            return (
                                <InstalledFonts />
                            );
                    }
                } }
            </TabPanel>
        </Modal>
    );
}

export default ({ ...props }) => (
    <FontLibraryProvider>
        <FontLibraryModal { ...props } />
    </FontLibraryProvider>
);
