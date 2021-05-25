/**
 * WordPress dependencies
 */
import {
	visitAdminPage,
	activatePlugin,
	deactivatePlugin,
} from '@wordpress/e2e-test-utils';

/**
 * TODO: Deleting widgets in the new widgets screen seems to be unreliable.
 * We visit the old widgets screen to delete them.
 * Refactor this to use real interactions in the new widgets screen once the bug is fixed.
 */
async function cleanupWidgets() {
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

export { cleanupWidgets };
