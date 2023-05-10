/**
 * WordPress dependencies
*/
import { __ } from '@wordpress/i18n';


export const FONT_LIBRARY_MODAL_TABS = [
    {
        name: 'active-fonts',
        title: __('Active Fonts'),
        className: 'active-fonts',
    },
    {
        name: 'installed-fonts',
        title: __('Installed Fonts'),
        className: 'installed-fonts',
    },
    {
        name: 'google-fonts',
        title: __('Add Google Fonts'),
        className: 'google-fonts',
    },
    {
        name: 'local-fonts',
        title: __('Add Local Fonts'),
        className: 'local-fonts',
    },
];

export const DEMO_TEXT = __( "Incredible as it may seem, I believe that the Aleph of Garay Street was a false Aleph" );
