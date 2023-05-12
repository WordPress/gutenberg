/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Modal,
    TabPanel,
    Button,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import FontLibraryProvider from './context';
import InstalledFonts from './installed-fonts';
import GoogleFonts from './google-fonts';
import LocalFonts from './local-fonts';
import { MODAL_TABS } from './constants';


function FontLibraryModal( { onRequestClose, initialTabName = "installed-fonts" }  ) {

    return (
        <FontLibraryProvider>
            <Modal
                title={ __("Fonts Library") }
                onRequestClose={ onRequestClose }
                isFullScreen={ true }
            >
              <TabPanel
                    className="fonts-library-panel"
                    initialTabName={ initialTabName }
                    tabs={ MODAL_TABS }
                >
                    { ( tab ) => {
                        switch ( tab.name ) {
                            case 'installed-fonts':
                                return (
                                    <InstalledFonts />
                                );
                            case 'google-fonts':
                                return (
                                    <GoogleFonts />
                                );
                            case 'local-fonts':
                                return (
                                    <LocalFonts />
                                );
                            default:
                                return null;
                        }
                    } }
                </TabPanel>
            </Modal>
        </FontLibraryProvider>
    );
}

export default FontLibraryModal;
