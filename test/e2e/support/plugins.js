/**
 * Node dependencies
 */
import { visitAdmin } from './utils';

export async function installPlugin( name, searchTerm ) {
	await visitAdmin( 'plugin-install.php?s=' + encodeURIComponent( searchTerm || name ) + '&tab=search&type=term' );
	await page.click( '.install-now[data-slug="' + name + '"]' );
	await page.waitForSelector( '.activate-now[data-slug="' + name + '"]' );
}

export async function activatePlugin( name ) {
	await visitAdmin( 'plugins.php' );
	await page.click( 'tr[data-slug="' + name + '"] .activate a' );
	await page.waitForSelector( 'tr[data-slug="' + name + '"] .deactivate a' );
}

export async function deactivatePlugin( name ) {
	await visitAdmin( 'plugins.php' );
	await page.click( 'tr[data-slug="' + name + '"] .deactivate a' );
	await page.waitForSelector( 'tr[data-slug="' + name + '"] .delete a' );
}

export async function uninstallPlugin( name ) {
	await visitAdmin( 'plugins.php' );
	const confirmPromise = new Promise( resolve => {
		const confirmDialog = ( dialog ) => {
			dialog.accept();
			page.removeListener( 'dialog', confirmDialog );
			resolve();
		};
		page.on( 'dialog', confirmDialog );
	} );
	await Promise.all( [
		page.click( 'tr[data-slug="' + name + '"] .delete a' ),
		confirmPromise,
	] );
	await page.waitForSelector( 'tr[data-slug="' + name + '"].deleted' );
}
