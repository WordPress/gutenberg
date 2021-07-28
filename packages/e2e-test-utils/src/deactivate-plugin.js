/**
 * Internal dependencies
 */
import { shell } from './wp-shell';

/**
 * Deactivates an active plugin.
 *
 * @param {string} slug Plugin slug.
 */
export async function deactivatePlugin( slug ) {
	await shell`
		require_once( ABSPATH . 'wp-admin/includes/plugin.php' );

		$plugins = get_plugins();

		foreach ( $plugins as $plugin_id => $plugin ) {
			if ( '${ slug }' == sanitize_title( $plugin['Title'] ) ) {
				return deactivate_plugins( $plugin_id );
			}
		}
	`;
}
