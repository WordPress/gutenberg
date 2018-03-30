/**
 * Node dependencies
 */
import { visitAdmin, waitForRequests } from './utils';

export async function installPlugin( name, searchTerm ) {
	await visitAdmin( 'plugin-install.php?s=' + encodeURIComponent( searchTerm || name ) + '&tab=search&type=term' );
	const promise = waitForRequests();
	await page.click( '.install-now[data-slug="' + name + '"]' );
	await promise;
}

export async function activatePlugin( name ) {
	await visitAdmin( 'plugins.php' );
	const promise = waitForRequests();
	await page.click( 'tr[data-slug="' + name + '"] .activate a' );
	await promise;
}

export async function deactivatePlugin( name ) {
	await visitAdmin( 'plugins.php' );
	const promise = waitForRequests();
	await page.click( 'tr[data-slug="' + name + '"] .deactivate a' );
	await promise;
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
	const promise = waitForRequests();
	await Promise.all( [
		page.click( 'tr[data-slug="' + name + '"] .delete a' ),
		confirmPromise,
	] );
	await promise;
}
