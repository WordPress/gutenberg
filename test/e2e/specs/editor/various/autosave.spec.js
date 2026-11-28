const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const BACKUP_NOTICE =
	/The backup of this post in your browser from .+ is different from the version below\./;

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
			.getByRole( 'document', { name: 'Add default block' } )
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
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'before save' );
		await pageUtils.pressKeys( 'primary+s' );
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();
		await page.keyboard.type( ' after save' );

		// Trigger local autosave.
		await page.clock.setFixedTime( new Date( '2026-10-12T15:41:00Z' ) );
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);
		// Reload without saving on the server.
		await page.reload();

		await expect(
			page.locator( '.notices-inline-notices__notice' )
		).toContainText(
			'The backup of this post in your browser from October 12, 2026 3:41 pm is different from the version below.'
		);
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'before save' },
			},
		] );

		await page.getByRole( 'button', { name: 'View the backup' } ).click();
		await expect(
			page.getByText(
				'Backup in this browser from October 12, 2026 3:41 pm',
				{ exact: true }
			)
		).toBeVisible();
		await expect(
			editor.canvas.locator(
				'.is-revision-modified .revision-diff-added'
			)
		).toHaveText( 'after save' );

		await page.getByRole( 'button', { name: 'Restore' } ).click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'before save after save' },
			},
		] );
		await expect(
			page.locator( '.notices-inline-notices__notice' )
		).toBeHidden();
	} );

	test( 'should keep the current content as a revision when restoring the backup', async ( {
		editor,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'before save' );
		await pageUtils.pressKeys( 'primary+s' );
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();

		const postId = await page.evaluate( () =>
			window.wp.data.select( 'core/editor' ).getCurrentPostId()
		);
		const backupKey = `wp-autosave-block-editor-post-${ postId }`;
		const getLatestRevision = async () => {
			const revisions = await requestUtils.rest( {
				path: `/wp/v2/posts/${ postId }/revisions`,
				params: { context: 'edit' },
			} );
			return revisions[ 0 ].content.raw;
		};

		// Make a backup, then edit further and autosave. A draft's autosave
		// updates the post without adding a revision.
		await page.keyboard.type( ' backup' );
		const backup = await page.evaluate( ( key ) => {
			window.wp.data
				.dispatch( 'core/editor' )
				.autosave( { local: true } );
			return window.sessionStorage.getItem( key );
		}, backupKey );
		await page.keyboard.type( ' newer' );
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave()
		);

		// The older backup is left behind, as by another tab.
		await page.evaluate(
			( [ key, value ] ) => window.sessionStorage.setItem( key, value ),
			[ backupKey, backup ]
		);
		await page.reload();
		await expect.poll( editor.getBlocks ).toEqual( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'before save backup newer',
					dropCap: false,
				},
				innerBlocks: [],
			},
		] );
		expect( await getLatestRevision() ).toBe(
			'<!-- wp:paragraph -->\n<p>before save</p>\n<!-- /wp:paragraph -->'
		);

		await page.getByRole( 'button', { name: 'View the backup' } ).focus();
		await page.keyboard.press( 'Enter' );
		await page.getByRole( 'button', { name: 'Restore' } ).focus();
		await page.keyboard.press( 'Enter' );
		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toHaveText( [ 'Backup restored.' ] );
		await expect.poll( editor.getBlocks ).toEqual( [
			{
				name: 'core/paragraph',
				attributes: { content: 'before save backup', dropCap: false },
				innerBlocks: [],
			},
		] );

		expect( await getLatestRevision() ).toBe(
			'<!-- wp:paragraph -->\n<p>before save backup newer</p>\n<!-- /wp:paragraph -->'
		);
	} );

	test( 'should wait for a running autosave before restoring the backup', async ( {
		editor,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'before save' );
		await pageUtils.pressKeys( 'primary+s' );
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();
		const postId = await page.evaluate( () =>
			window.wp.data.select( 'core/editor' ).getCurrentPostId()
		);
		const backupKey = `wp-autosave-block-editor-post-${ postId }`;

		// Make a backup, then save past it.
		await page.keyboard.type( ' backup' );
		const backup = await page.evaluate( ( key ) => {
			window.wp.data
				.dispatch( 'core/editor' )
				.autosave( { local: true } );
			return window.sessionStorage.getItem( key );
		}, backupKey );
		await page.keyboard.type( ' saved' );
		await pageUtils.pressKeys( 'primary+s' );
		await page.waitForFunction(
			() => ! window.wp.data.select( 'core/editor' ).isEditedPostDirty()
		);
		await page.evaluate(
			( [ key, value ] ) => window.sessionStorage.setItem( key, value ),
			[ backupKey, backup ]
		);
		await page.reload();

		// Hold an autosave of newer text until Restore is pressed.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' newest' );
		let releaseAutosave;
		const autosaveReleased = new Promise( ( resolve ) => {
			releaseAutosave = resolve;
		} );
		await page.route(
			( url ) => decodeURIComponent( url.href ).includes( '/autosaves' ),
			async ( route ) => {
				await autosaveReleased;
				await route.continue();
			}
		);
		const autosaveRequest = page.waitForRequest( ( request ) =>
			decodeURIComponent( request.url() ).includes( '/autosaves' )
		);
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).autosave();
		} );
		await autosaveRequest;
		await page.getByRole( 'button', { name: 'View the backup' } ).focus();
		await page.keyboard.press( 'Enter' );
		await page.getByRole( 'button', { name: 'Restore' } ).focus();
		await page.keyboard.press( 'Enter' );
		releaseAutosave();

		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toHaveText( [ 'Backup restored.' ] );
		await expect.poll( editor.getBlocks ).toEqual( [
			{
				name: 'core/paragraph',
				attributes: { content: 'before save backup', dropCap: false },
				innerBlocks: [],
			},
		] );
		const revisions = await requestUtils.rest( {
			path: `/wp/v2/posts/${ postId }/revisions`,
			params: { context: 'edit' },
		} );
		expect( revisions[ 0 ].content.raw ).toBe(
			'<!-- wp:paragraph -->\n<p>before save backup saved newest</p>\n<!-- /wp:paragraph -->'
		);
	} );

	test( 'should keep the backup when its view is closed', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
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
		await page.reload();

		await page.getByRole( 'button', { name: 'View the backup' } ).click();
		await page.getByRole( 'button', { name: 'Exit' } ).click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'before save' },
			},
		] );
		await expect(
			page.locator( '.notices-inline-notices__notice' )
		).toContainText( BACKUP_NOTICE );
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 1 );
	} );

	test( 'should show the backup in blocks that read the post', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/post-excerpt' } );
		await editor.insertBlock( { name: 'core/post-title' } );
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).editPost( {
				title: 'Saved title',
				excerpt: 'Saved excerpt',
			} )
		);
		await pageUtils.pressKeys( 'primary+s' );
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Draft saved' } )
			.waitFor();
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).editPost( {
				title: 'Backup title',
				excerpt: 'Backup excerpt',
			} )
		);
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);
		await page.reload();

		await page.getByRole( 'button', { name: 'View the backup' } ).click();
		await expect(
			editor.canvas.locator( '.wp-block-post-excerpt__excerpt' )
		).toHaveText( 'Backup excerpt' );
		await expect(
			editor.canvas.locator(
				'.wp-block-post-title:not(.editor-post-title)'
			)
		).toHaveText( 'Backup title' );
	} );

	test( "shouldn't contaminate other posts", async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
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
			page.locator( '.notices-inline-notices__notice' )
		).toContainText( BACKUP_NOTICE );

		await admin.createNewPost();
		await expect(
			page.locator( '.notices-inline-notices__notice' )
		).toBeHidden();
	} );

	test( 'should clear local autosave after successful remote autosave', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
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
			.getByRole( 'document', { name: 'Add default block' } )
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
			.getByRole( 'document', { name: 'Add default block' } )
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
			page.locator( '.notices-inline-notices__notice' )
		).toContainText(
			'Updating failed because you were offline. Please verify your connection and try again.'
		);
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
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'before save' );
		await editor.publishPost();

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraph.click();
		// Type slowly to ensure that autosave happens more than 1s after publish.
		await page.keyboard.type( ' after save', { delay: 100 } );

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

		// Only remote autosave notice should be applied.
		await expect(
			page.locator( '.notices-inline-notices__notice' )
		).toContainText(
			'There is an autosave of this post that is more recent than the version below.'
		);
	} );

	test( 'opens the visual revisions view from the autosave notice', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'before save' );
		await editor.publishPost();

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraph.click();
		// Type slowly so the autosave happens more than 1s after publish.
		await page.keyboard.type( ' after save', { delay: 100 } );

		// Trigger a server-side autosave newer than the saved version.
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

		// Reload so the autosave notice appears.
		await page.reload();
		await page.waitForFunction( () => window?.wp?.data );

		const autosaveNotice = page
			.locator( '.notices-inline-notices__notice' )
			.filter( {
				hasText:
					'There is an autosave of this post that is more recent than the version below.',
			} );
		await expect( autosaveNotice ).toBeVisible();

		// Opening the autosave switches to the visual revisions view in place.
		await page.getByRole( 'button', { name: 'View the autosave' } ).click();
		await expect(
			page.getByRole( 'button', { name: 'Exit' } )
		).toBeVisible();

		// Restoring the autosave dismisses the notice.
		await page.getByRole( 'button', { name: 'Restore' } ).click();
		await expect( autosaveNotice ).toBeHidden();
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
