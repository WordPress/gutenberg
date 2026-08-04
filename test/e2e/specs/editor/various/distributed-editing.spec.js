/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function waitForDistributedEditingReady( page ) {
	// The middleware only engages once the accepted state has been fetched.
	await page.waitForFunction(
		() =>
			window.__gutenbergDEBridge && window.__gutenbergDEBridge.baseVersion
	);
}

async function getServerContent( page ) {
	return page.evaluate( async () => {
		const postId = window.wp.data
			.select( 'core/editor' )
			.getCurrentPostId();
		const state = await window.wp.apiFetch( {
			path: '/gutenberg-de/v1/posts/' + postId + '/state',
		} );
		return state.content;
	} );
}

/**
 * Sequesters a protected proposal server-side (as if another session had
 * saved it without approval) and reloads the editor so the pending-review
 * block renders.
 *
 * @param {Object} page      Playwright page.
 * @param {Object} pageUtils Page utils fixture.
 * @param {Object} editor    Editor fixture.
 */
async function sequesterScriptProposal( page, pageUtils, editor ) {
	await editor.insertBlock( {
		attributes: { content: 'Base paragraph.' },
		name: 'core/paragraph',
	} );
	await waitForDistributedEditingReady( page );
	await pageUtils.pressKeys( 'primary+s' );
	await page
		.getByRole( 'button', { name: 'Dismiss this notice' } )
		.filter( { hasText: 'Draft saved' } )
		.waitFor();

	await page.evaluate( async () => {
		const postId = window.wp.data
			.select( 'core/editor' )
			.getCurrentPostId();
		const state = await window.wp.apiFetch( {
			path: '/gutenberg-de/v1/posts/' + postId + '/state',
		} );
		await window.wp.apiFetch( {
			data: {
				base_version: state.version,
				content:
					state.content +
					'\n\n<!-- wp:html -->\n<script>document.title = "proposed";</script>\n<!-- /wp:html -->',
			},
			method: 'POST',
			path: '/gutenberg-de/v1/posts/' + postId + '/save',
		} );
	} );

	await page.reload();
	await expect(
		editor.canvas.getByText( /Pending review \(/ )
	).toBeVisible();
}

test.describe( 'Distributed editing prototype', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'saves unprotected content without review', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			attributes: { content: 'Plain collaborative paragraph.' },
			name: 'core/paragraph',
		} );

		await waitForDistributedEditingReady( page );
		await pageUtils.pressKeys( 'primary+s' );

		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();

		expect( await getServerContent( page ) ).toContain(
			'Plain collaborative paragraph.'
		);
	} );

	test( "auto-approves the user's own protected changes on save", async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			attributes: {
				content: '<script>document.title = "own-edit";</script>',
			},
			name: 'core/html',
		} );

		await waitForDistributedEditingReady( page );
		await pageUtils.pressKeys( 'primary+s' );

		// No modal, no bounce: the save completes as a normal editor save.
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();

		expect( await getServerContent( page ) ).toContain(
			'<script>document.title = "own-edit";</script>'
		);
	} );

	test( 'renders sequestered proposals as review blocks and approves in-canvas', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await sequesterScriptProposal( page, pageUtils, editor );

		// Collapsed: the kses-filtered placeholder renders as normal content
		// and the review UI (with the raw payload) stays out of the DOM.
		await expect(
			editor.canvas.getByText( 'document.title = "proposed";' )
		).toBeVisible();
		await expect(
			editor.canvas.getByLabel( 'Proposed markup' )
		).toBeHidden();
		expect( await getServerContent( page ) ).not.toContain( '<script' );

		await editor.canvas
			.getByRole( 'button', { name: 'Review', exact: true } )
			.click();

		// The proposal renders as inert text, not live markup.
		await expect(
			editor.canvas.getByLabel( 'Proposed markup' )
		).toHaveValue( /document\.title = "proposed"/ );

		await editor.canvas
			.getByRole( 'button', { name: 'Approve', exact: true } )
			.click();

		await waitForDistributedEditingReady( page );
		await pageUtils.pressKeys( 'primary+s' );
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();

		const serverContent = await getServerContent( page );
		expect( serverContent ).toContain(
			'<script>document.title = "proposed";</script>'
		);
		expect( serverContent ).not.toContain( 'wp:de/pending-review' );
	} );

	test( 'adopts sequestered content immediately without a reload', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			attributes: {
				content: '<script>document.title = "retraction";</script>',
			},
			name: 'core/html',
		} );

		await waitForDistributedEditingReady( page );
		// Withhold this session's auto-approvals so the save sequesters,
		// exactly as a foreign (unprivileged or remote) session's would.
		await page.evaluate( () => {
			window.__gutenbergDEBridge.disableAutoApprovals = true;
		} );
		await pageUtils.pressKeys( 'primary+s' );

		// Retraction UX: the wrapper replaces the proposal in-canvas, no
		// reload required, and a notice explains what happened.
		await expect(
			page.getByText(
				'Some protected changes were sequestered into pending-review blocks.'
			)
		).toBeVisible();
		await expect(
			editor.canvas.getByText( /Pending review \(/ )
		).toBeVisible();
		expect( await getServerContent( page ) ).not.toContain( '<script' );

		// Restore auto-approvals and complete the review in the same session.
		await page.evaluate( () => {
			window.__gutenbergDEBridge.disableAutoApprovals = false;
		} );
		await editor.canvas
			.getByRole( 'button', { name: 'Review', exact: true } )
			.click();
		await editor.canvas
			.getByRole( 'button', { name: 'Approve', exact: true } )
			.click();
		await pageUtils.pressKeys( 'primary+s' );

		await expect
			.poll( async () => getServerContent( page ) )
			.toContain( '<script>document.title = "retraction";</script>' );
	} );

	test( 'rejecting a review block keeps the filtered placeholder', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await sequesterScriptProposal( page, pageUtils, editor );

		await editor.canvas
			.getByRole( 'button', { name: 'Review', exact: true } )
			.click();
		await editor.canvas
			.getByRole( 'button', { name: 'Reject', exact: true } )
			.click();

		await waitForDistributedEditingReady( page );
		await pageUtils.pressKeys( 'primary+s' );
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();

		const serverContent = await getServerContent( page );
		expect( serverContent ).not.toContain( '<script' );
		expect( serverContent ).not.toContain( 'wp:de/pending-review' );
	} );
} );
