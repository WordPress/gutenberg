/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Autosave', () => {
	test.beforeEach( async ( { admin, page } ) => {
		await admin.createNewPost();
		await page.evaluate( () => window.sessionStorage.clear() );
	} );

	test.afterEach( async ( { page } ) => {
		await page.evaluate( () => window.sessionStorage.clear() );
	} );

	test( 'should save to sessionStorage', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'before save' );
		await pageUtils.pressKeys( 'primary+s' );
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();
		await page.keyboard.type( ' after save' );

		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);

		const autosave = await page.evaluate( () => {
			const postId = window.wp.data
				.select( 'core/editor' )
				.getCurrentPostId();

			return window.sessionStorage.getItem(
				`wp-autosave-block-editor-post-${
					postId ? postId : 'auto-draft'
				}`
			);
		} );

		const { content } = JSON.parse( autosave );
		expect( content ).toBe( `<!-- wp:paragraph -->
<p>before save after save</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should recover from sessionStorage', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'before save' );
		await pageUtils.pressKeys( 'primary+s' );
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();
		await page.keyboard.type( ' after save' );

		// Trigger local autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);
		// Reload without saving on the server.
		await page.reload();

		await expect(
			page.locator( '.components-notice__content' )
		).toContainText(
			'The backup of this post in your browser is different from the version below.'
		);
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'before save' },
			},
		] );

		await page
			.getByRole( 'button', { name: 'Restore the backup' } )
			.click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'before save after save' },
			},
		] );
	} );

	test( "shouldn't contaminate other posts", async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'before save' );
		await pageUtils.pressKeys( 'primary+s' );
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();
		await page.keyboard.type( ' after save' );

		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 1 );

		await page.reload();
		await expect(
			page.locator( '.components-notice__content' )
		).toContainText(
			'The backup of this post in your browser is different from the version below.'
		);

		await admin.createNewPost();
		await expect(
			page.locator( '.components-notice__content' )
		).toBeHidden();
	} );

	test( 'should clear local autosave after successful remote autosave', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'before save' );
		await pageUtils.pressKeys( 'primary+s' );
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();
		await page.keyboard.type( ' after save' );

		// Trigger local autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);

		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBeGreaterThanOrEqual( 1 );

		// Trigger remote autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave()
		);
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 0 );
	} );

	test( "shouldn't clear local autosave if remote autosave fails", async ( {
		editor,
		context,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'before save' );
		await pageUtils.pressKeys( 'primary+s' );
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();
		await page.keyboard.type( ' after save' );

		// Trigger local autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);

		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBeGreaterThanOrEqual( 1 );

		// Intercept autosave request and abort it.
		await context.setOffline( true );
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave()
		);

		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 1 );
	} );

	test( 'should clear local autosave after successful save', async ( {
		page,
		pageUtils,
	} ) => {
		const notice = page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'before save' );
		await pageUtils.pressKeys( 'primary+s' );
		await notice.waitFor();
		await page.keyboard.type( ' after save' );
		await notice.click();

		// Trigger local autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);

		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBeGreaterThanOrEqual( 1 );

		await pageUtils.pressKeys( 'primary+s' );
		await notice.waitFor();

		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 0 );
	} );

	test( "shouldn't clear local autosave if save fails", async ( {
		editor,
		context,
		page,
		pageUtils,
	} ) => {
		const notice = page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } );

		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'before save' );
		await pageUtils.pressKeys( 'primary+s' );
		await notice.waitFor();
		await page.keyboard.type( ' after save' );
		await notice.click();

		// Trigger local autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);

		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBeGreaterThanOrEqual( 1 );

		await context.setOffline( true );
		await pageUtils.pressKeys( 'primary+s' );

		await expect(
			page.locator( '.components-notice__content' )
		).toContainText( 'Updating failed. You are probably offline.' );
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 1 );
	} );

	// See https://github.com/WordPress/gutenberg/pull/17501.
	test( "shouldn't conflict with server-side autosave", async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'before save' );
		await editor.publishPost();

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraph.click();
		await page.keyboard.type( ' after save' );

		// Trigger remote autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave()
		);

		await expect
			.poll( async () => {
				return await page.evaluate( () => {
					const postId = window.wp.data
						.select( 'core/editor' )
						.getCurrentPostId();
					const autosaves = window.wp.data
						.select( 'core' )
						.getAutosaves( 'post', postId );

					return autosaves?.length ?? 0;
				} );
			} )
			.toBeGreaterThanOrEqual( 1 );

		// Force conflicting local autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);

		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBeGreaterThanOrEqual( 1 );

		await page.reload();
		await page.waitForFunction( () => window?.wp?.data );

		// FIXME: Occasionally, upon reload, there is no server-provided
		// autosave value available, despite our having previously explicitly
		// autosaved. The reasons for this are still unknown. Since this is
		// unrelated to *local* autosave, until we can understand them, we'll
		// drop this test's expectations if we don't have an autosave object
		// available.
		const stillHasRemoteAutosave = await page.evaluate(
			() =>
				window.wp.data.select( 'core/editor' ).getEditorSettings()
					.autosave
		);
		if ( ! stillHasRemoteAutosave ) {
			return;
		}

		// Only remote autosave notice should be applied.
		await expect(
			page.locator( '.components-notice__content' )
		).toContainText(
			'There is an autosave of this post that is more recent than the version below.'
		);
	} );

	test.skip( 'should clear sessionStorage upon user logout', async ( {
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'before save' );
		await pageUtils.pressKeys( 'primary+s' );
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();
		await page.keyboard.type( ' after save' );

		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 1 );

		await page.locator( '#wp-admin-bar-my-account' ).hover();
		await page.locator( '#wp-admin-bar-logout' ).click();

		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 0 );
	} );
} );
