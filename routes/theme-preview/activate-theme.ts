import { addQueryArgs } from '@wordpress/url';

declare global {
	interface Window {
		// Theme activation nonce, printed on `admin_head` by Core's
		// `wp_block_theme_activate_nonce()` for `wp_theme_preview` requests.
		WP_BLOCK_THEME_ACTIVATE_NONCE?: string;
	}
}

/**
 * Activates a theme through the classic themes screen action, authorized by
 * the nonce Core prints for the previewed theme (there is no REST endpoint
 * for activating a theme). Core redirects to the themes screen, which
 * announces the activation; failures like an expired nonce render Core's
 * standard error screen, exactly as the themes screen's own Activate link
 * does.
 *
 * @param stylesheet Stylesheet (directory name) of the theme to activate.
 */
export function activateTheme( stylesheet: string ) {
	window.location.href = addQueryArgs( 'themes.php', {
		action: 'activate',
		stylesheet,
		_wpnonce: window.WP_BLOCK_THEME_ACTIVATE_NONCE,
	} );
}
