/**
 * Internal dependencies
 */
import { activatePlugin } from './activate-plugin';
import { deactivatePlugin } from './deactivate-plugin';
import { visitAdminPage } from './visit-admin-page';

/**
 * Delete all the widgets in the widgets screen.
 */
export async function deleteAllWidgets() {
	// TODO: Deleting widgets in the new widgets screen is cumbersome and slow.
	// To workaround this for now, we visit the old widgets screen to delete them.
	await activatePlugin( 'gutenberg-test-classic-widgets' );

	await visitAdminPage( 'widgets.php' );

	let widget = await page.$( '.widgets-sortables .widget' );

	// We have to do this one-by-one since there might be race condition when deleting multiple widgets at once.
	while ( widget ) {
		const deleteButton = await widget.$( 'button.widget-control-remove' );
		const id = await widget.evaluate( ( node ) => node.id );
		await deleteButton.evaluate( ( node ) => node.click() );
		// Wait for the widget to be removed from DOM.
		await page.waitForSelector( `#${ id }`, { hidden: true } );

		widget = await page.$( '.widgets-sortables .widget' );
	}

	await deactivatePlugin( 'gutenberg-test-classic-widgets' );
}
