/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Modal,
    TabPanel,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ActiveFonts from './active-fonts';
import InstalledFonts from './installed-fonts';
import GoogleFonts from './google-fonts';
import LocalFonts from './local-fonts';
import { FONT_LIBRARY_MODAL_TABS } from './constants';

async function getFontLibrary() {
    const config = {
        path: '/wp/v2/fonts_library',
    };
    const { post_content = {} } = await apiFetch( config );
    return post_content;
}

async function getGoogleFonts() {
    const config = {
        path: '/wp/v2/fonts_library/google_fonts',
    };
    const { items = [] } = await apiFetch( config );
    return items;
}

function FontLibraryModal( { onRequestClose, initialTabName = "active-fonts" }  ) {

    const [ fontLibrary, setFontLibrary ] = useState( {} );
    const [ googleFonts, setGoogleFonts ] = useState( [] );

    useEffect( () => {
        getFontLibrary().then( ( response ) => {
            setFontLibrary( response );
        } );
        getGoogleFonts().then( ( response ) => {
            setGoogleFonts( response );
        } );
    }, [] );

    return (
        <Modal
            title={ __("Fonts Library") }
            onRequestClose={ onRequestClose }
            isFullScreen={ true }
        >
              <TabPanel
                className="fonts-library-panel"
                initialTabName={ initialTabName }
                tabs={ FONT_LIBRARY_MODAL_TABS }
            >
                { ( tab ) => {
                    switch ( tab.name ) {
                        case 'active-fonts':
                            return (
                                <ActiveFonts />
                            );
                        case 'installed-fonts':
                            return (
                                <InstalledFonts fontLibrary={ fontLibrary } />
                            );
                        case 'google-fonts':
                            return (
                                <GoogleFonts googleFonts={ googleFonts } />
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
    );
}

export default FontLibraryModal;
