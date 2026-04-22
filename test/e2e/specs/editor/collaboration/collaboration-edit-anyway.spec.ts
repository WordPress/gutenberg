/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

// With retries: initial 20s debounce + ~26s retry cycle before the modal
// surfaces. Allow generous timeouts on waits.
const MODAL_TIMEOUT_MS = 90_000;

test.describe( 'Edit Anyway when sync connection fails', () => {
	test( 'lets the user dismiss the modal and keep editing while disconnected', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Edit Anyway Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openPost( post.id );

		// Simulate a sync transport outage by failing all polling requests.
		await page.route( '**/wp-sync/v1/updates**', ( route ) =>
			route.abort( 'failed' )
		);

		// After retries exhaust the modal appears. A generic network failure
		// surfaces the unknown-error title ("Connection lost").
		const errorModal = page.getByRole( 'dialog', {
			name: 'Connection lost',
		} );
		await expect( errorModal ).toBeVisible( {
			timeout: MODAL_TIMEOUT_MS,
		} );

		await errorModal
			.getByRole( 'button', { name: 'Edit Anyway' } )
			.click();

		// The same modal swaps into the warning view (no second dialog).
		const confirmModal = page.getByRole( 'dialog', {
			name: 'Edit while disconnected?',
		} );
		await expect( confirmModal ).toBeVisible();
		await expect( errorModal ).toBeHidden();
		await expect(
			confirmModal.getByText(
				'Your edits will be saved locally and synced when the connection returns.'
			)
		).toBeVisible();

		await confirmModal
			.getByRole( 'button', { name: 'Edit Anyway' } )
			.click();

		// Modal dismissed entirely; persistent inline notice appears.
		await expect( confirmModal ).toBeHidden();
		const notice = page.locator( '.editor-sync-disconnected-notice' );
		await expect( notice ).toBeVisible();

		// Editing still works locally.
		const body = page.getByRole( 'document', {
			name: /empty block|add default block|paragraph block/i,
		} );
		await body.first().click();
		await page.keyboard.type( 'Offline edit survives.' );
		await expect(
			page.getByText( 'Offline edit survives.' )
		).toBeVisible();

		// Unblock the network; notice disappears on reconnect.
		await page.unroute( '**/wp-sync/v1/updates**' );
		await expect( notice ).toBeHidden( { timeout: 30_000 } );
	} );
} );
