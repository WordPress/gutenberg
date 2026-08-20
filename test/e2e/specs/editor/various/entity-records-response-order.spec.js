const path = require( 'path' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/*
 * The exact query the inserter's Media tab resolves for its "Images" source:
 * `per_page` and `search` come from the media panel, `media_type` and
 * `orderBy` are added by the editor's core media category. The test resolves
 * the same query so it races (and asserts) the same cached resolution the
 * panel reads.
 */
const IMAGES_QUERY = {
	per_page: 20,
	search: '',
	media_type: 'image',
	orderBy: 'date',
};

test.describe( 'Entity records response order', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'keeps a fresher attachment list over a stale response delivered late', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		/*
		 * Regression test for https://github.com/WordPress/gutenberg/issues/81885.
		 *
		 * `invalidateResolution` starts a second request for the same list
		 * while the first may still be in flight, and the store used to keep
		 * whichever response was *delivered* last. Batch uploads invalidate
		 * the attachment list once per file, so a list read before an upload
		 * finished could be delivered after the refetch that already contains
		 * the new attachment, and silently hide it everywhere the list is
		 * shown.
		 *
		 * Simulate that worst-case ordering deterministically: hold the first
		 * list request's response (reading its stale body immediately),
		 * upload a new image, let a refetch deliver a fresher list, and only
		 * then deliver the stale one.
		 */
		await admin.createNewPost();

		const LIST_REQUEST_MATCHER = /wp\/v2\/media\?.*media_type=image/;

		let holding = false;
		let staleBodyRead = () => {};
		const staleBodyReadGate = new Promise( ( resolve ) => {
			staleBodyRead = resolve;
		} );
		let releaseStaleResponse = () => {};
		const staleResponseGate = new Promise( ( resolve ) => {
			releaseStaleResponse = resolve;
		} );
		let staleResponseDelivered = Promise.resolve();

		await page.route( LIST_REQUEST_MATCHER, async ( route ) => {
			if ( route.request().method() !== 'GET' || holding ) {
				await route.continue();
				return;
			}
			holding = true;
			// Read the (stale) body now, deliver it later.
			const response = await route.fetch();
			const body = await response.body();
			staleBodyRead();
			staleResponseDelivered = ( async () => {
				await staleResponseGate;
				await route.fulfill( { response, body } );
			} )();
			await staleResponseDelivered;
		} );

		// Start resolving the attachment list; its response stays in flight,
		// with a body read before the upload below exists.
		await page.evaluate( ( query ) => {
			window.wp.data
				.resolveSelect( 'core' )
				.getEntityRecords( 'postType', 'attachment', query );
		}, IMAGES_QUERY );
		await staleBodyReadGate;

		// A new image is uploaded while that response is held.
		const media = await requestUtils.uploadMedia(
			path.join(
				__dirname,
				'..',
				'..',
				'..',
				'assets',
				'10x10_e2e_test_image_z9T8jK.png'
			)
		);

		// The upload invalidates the list, and the refetch delivers a
		// fresher response that already contains the new attachment.
		await page.evaluate( async ( query ) => {
			window.wp.data
				.dispatch( 'core' )
				.invalidateResolution( 'getEntityRecords', [
					'postType',
					'attachment',
					query,
				] );
			await window.wp.data
				.resolveSelect( 'core' )
				.getEntityRecords( 'postType', 'attachment', query );
		}, IMAGES_QUERY );

		const listContainsUpload = () =>
			page.evaluate(
				( { query, id } ) =>
					!! window.wp.data
						.select( 'core' )
						.getEntityRecords( 'postType', 'attachment', query )
						?.some( ( record ) => record.id === id ),
				{ query: IMAGES_QUERY, id: media.id }
			);

		await expect.poll( listContainsUpload ).toBe( true );

		// Deliver the stale response last and wait until the page has fully
		// received it. The bounded wait lets the page finish processing the
		// late response; the assertions below then check that it had no
		// lasting effect.
		releaseStaleResponse();
		await staleResponseDelivered;
		await new Promise( ( resolve ) => setTimeout( resolve, 1500 ) );

		// The stale list must not replace the fresher one…
		expect( await listContainsUpload() ).toBe( true );

		// …so the inserter's Media tab still shows the uploaded image.
		await page.getByLabel( 'Block Inserter' ).click();
		await page.getByRole( 'tab', { name: 'Media' } ).click();
		await page.getByRole( 'tab', { name: 'Images', exact: true } ).click();
		await expect( page.getByLabel( media.title.raw ) ).toBeVisible();

		await page.unroute( LIST_REQUEST_MATCHER );
	} );
} );
