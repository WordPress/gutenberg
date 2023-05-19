/**
 * WordPress dependencies
*/
import { __ } from '@wordpress/i18n';


export const MODAL_TABS = [
    {
        name: 'installed-fonts',
        title: __('Activate Fonts'),
        className: 'installed-fonts',
    },
    {
        name: 'google-fonts',
        title: __('Install Google Fonts'),
        className: 'google-fonts',
    },
    {
        name: 'local-fonts',
        title: __('Install Local Fonts'),
        className: 'local-fonts',
    },
];

export const DEMO_TEXT = __( "Incredible as it may seem, I believe that the Aleph of Garay Street was a false Aleph" );

// Google Fonts API categories mappping to fallback system fonts
export const GOOGLE_FONT_FALLBACKS = {
    'display': 'system-ui',
    'sans-serif': 'sans-serif',
    'serif': 'serif',
    'handwriting': 'cursive',
    'monospace': 'monospace',
};

export const DEFAULT_DEMO_CONFIG = {
    text: DEMO_TEXT,
    fontSize: 24,
};