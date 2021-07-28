/**
 * Internal dependencies
 */
import { shell } from './wp-shell';

/**
 * Activates an installed theme.
 *
 * @param {string} slug Theme slug.
 */
export async function activateTheme( slug ) {
	await shell`
		switch_theme( '${ slug }' );
	`;
}
