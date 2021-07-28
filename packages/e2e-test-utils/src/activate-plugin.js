/**
 * Internal dependencies
 */
import { shell } from './wp-shell';

/**
 * Activates an installed plugin.
 *
 * @param {string} slug Plugin slug.
 */
export async function activatePlugin( slug ) {
	await shell`
		require_once( ABSPATH . 'wp-admin/includes/plugin.php' );

		$plugins = get_plugins();

		foreach ( $plugins as $plugin_id => $plugin ) {
			if ( '${ slug }' == sanitize_title( $plugin['Title'] ) ) {
				return activate_plugin( $plugin_id );
			}
		}
	`;
}
