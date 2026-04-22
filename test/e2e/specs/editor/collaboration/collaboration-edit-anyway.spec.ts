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
		const modal = page.getByRole( 'dialog', {
			name: 'Connection lost',
		} );
		await expect( modal ).toBeVisible( { timeout: MODAL_TIMEOUT_MS } );

		const editAnywayButton = modal.getByRole( 'button', {
			name: 'Edit Anyway',
		} );
		await expect( editAnywayButton ).toBeVisible();
		await editAnywayButton.click();

		// Secondary confirmation dialog warns about data-loss risk.
		await expect(
			page.getByText(
				'Your edits will be saved locally and synced when the connection returns.'
			)
		).toBeVisible();
		// Click the Edit Anyway button in the confirm dialog (distinct from
		// the one in the modal, which is now hidden behind the dialog).
		await page
			.getByRole( 'button', { name: 'Edit Anyway' } )
			.last()
			.click();

		// Modal dismissed; persistent inline notice appears.
		await expect( modal ).toBeHidden();
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
