const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function getFootnotes( page, withoutSave = false ) {
	// Save post so we can check meta.
	if ( ! withoutSave ) {
		await page.getByRole( 'button', { name: 'Save draft' } ).click();
	}
	await page.waitForSelector( 'button:text("Saved")' );
	const footnotes = await page.evaluate( () => {
		return window.wp.data
			.select( 'core' )
			.getEntityRecord(
				'postType',
				'post',
				window.wp.data.select( 'core/editor' ).getCurrentPostId()
			).meta.footnotes;
	} );
	return JSON.parse( footnotes );
}

test.describe( 'Footnotes', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be inserted', async ( { editor, page } ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'first paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'second paragraph' );

		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'More' );
		await page.locator( 'button:text("Footnote")' ).click();

		await page.keyboard.type( 'first footnote' );

		const id1 = await editor.canvas.locator( ':root' ).evaluate( () => {
			return document.activeElement.id;
		} );

		// The ID is also the anchor target of the footnote link. A CSS
		// identifier cannot start with a digit, so a letter prefix keeps
		// `querySelector( '#' + id )` and `#id` style rules working.
		expect( id1 ).toMatch( /^fn-[0-9a-f-]{36}$/ );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'first paragraph' },
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: `second paragraph<sup data-fn="${ id1 }" class="fn"><a href="#${ id1 }" id="${ id1 }-link">1</a></sup>`,
				},
			},
			{
				name: 'core/footnotes',
			},
		] );

		// Check if the numbers in the editor content updated.
		await expect( editor.canvas.locator( '.fn' ) ).toHaveText( '1' );

		await editor.canvas.locator( 'p:text("first paragraph")' ).click();

		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'More' );
		await page.locator( 'button:text("Footnote")' ).click();

		await page.keyboard.type( 'second footnote' );

		const id2 = await editor.canvas.locator( ':root' ).evaluate( () => {
			return document.activeElement.id;
		} );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: `first paragraph<sup data-fn="${ id2 }" class="fn"><a href="#${ id2 }" id="${ id2 }-link">1</a></sup>`,
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: `second paragraph<sup data-fn="${ id1 }" class="fn"><a href="#${ id1 }" id="${ id1 }-link">2</a></sup>`,
				},
			},
			{
				name: 'core/footnotes',
			},
		] );

		expect( await getFootnotes( page ) ).toMatchObject( [
			{
				content: 'second footnote',
				id: id2,
			},
			{
				content: 'first footnote',
				id: id1,
			},
		] );

		await editor.canvas.locator( 'p:text("first paragraph")' ).click();

		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'Move down' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: `second paragraph<sup data-fn="${ id1 }" class="fn"><a href="#${ id1 }" id="${ id1 }-link">1</a></sup>`,
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: `first paragraph<sup data-fn="${ id2 }" class="fn"><a href="#${ id2 }" id="${ id2 }-link">2</a></sup>`,
				},
			},
			{
				name: 'core/footnotes',
			},
		] );

		expect( await getFootnotes( page ) ).toMatchObject( [
			{
				content: 'first footnote',
				id: id1,
			},
			{
				content: 'second footnote',
				id: id2,
			},
		] );

		await editor.canvas.locator( `a[href="#${ id2 }-link"]` ).click();
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: `second paragraph<sup data-fn="${ id1 }" class="fn"><a href="#${ id1 }" id="${ id1 }-link">1</a></sup>`,
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: `first paragraph`,
				},
			},
			{
				name: 'core/footnotes',
			},
		] );

		expect( await getFootnotes( page ) ).toMatchObject( [
			{
				content: 'first footnote',
				id: id1,
			},
		] );

		await editor.canvas.locator( `a[href="#${ id1 }-link"]` ).click();
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: `second paragraph`,
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: `first paragraph`,
				},
			},
			{
				name: 'core/footnotes',
			},
		] );

		expect( await getFootnotes( page ) ).toMatchObject( [] );
	} );

	test( 'can be inserted in a list', async ( { editor, page } ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* 1' );
		await editor.clickBlockToolbarButton( 'More' );
		await page.locator( 'button:text("Footnote")' ).click();

		await page.keyboard.type( 'a' );

		const id1 = await editor.canvas.locator( ':root' ).evaluate( () => {
			return document.activeElement.id;
		} );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: {
							content: `1<sup data-fn="${ id1 }" class="fn"><a href="#${ id1 }" id="${ id1 }-link">1</a></sup>`,
						},
					},
				],
			},
			{
				name: 'core/footnotes',
			},
		] );

		expect( await getFootnotes( page ) ).toMatchObject( [
			{
				content: 'a',
				id: id1,
			},
		] );
	} );

	test( 'can be inserted in a table', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/table' } );
		await editor.canvas
			.locator( 'role=button[name="Create Table"i]' )
			.click();
		await page.keyboard.type( '1' );
		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'More' );
		await page.locator( 'button:text("Footnote")' ).click();

		await page.keyboard.type( 'a' );

		const id1 = await editor.canvas.locator( ':root' ).evaluate( () => {
			return document.activeElement.id;
		} );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/table',
				attributes: {
					body: [
						{
							cells: [
								{
									content: `1<sup data-fn="${ id1 }" class="fn"><a href="#${ id1 }" id="${ id1 }-link">1</a></sup>`,
									tag: 'td',
								},
								{
									content: '',
									tag: 'td',
								},
							],
						},
						{
							cells: [
								{
									content: '',
									tag: 'td',
								},
								{
									content: '',
									tag: 'td',
								},
							],
						},
					],
				},
			},
			{
				name: 'core/footnotes',
			},
		] );

		expect( await getFootnotes( page ) ).toMatchObject( [
			{
				content: 'a',
				id: id1,
			},
		] );
	} );

	test( 'works with revisions', async ( { editor, page } ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'first paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'second paragraph' );

		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'More' );
		await page.locator( 'button:text("Footnote")' ).click();

		// Check if content is correctly slashed on save and restore.
		await page.keyboard.type( 'first footnote"' );

		const id1 = await editor.canvas.locator( ':root' ).evaluate( () => {
			return document.activeElement.id;
		} );

		await editor.canvas.locator( 'p:text("first paragraph")' ).click();

		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'More' );
		await page.locator( 'button:text("Footnote")' ).click();

		await page.keyboard.type( 'second footnote' );

		const id2 = await editor.canvas.locator( ':root' ).evaluate( () => {
			return document.activeElement.id;
		} );

		// This also saves the post!
		expect( await getFootnotes( page ) ).toMatchObject( [
			{
				content: 'second footnote',
				id: id2,
			},
			{
				content: 'first footnote"',
				id: id1,
			},
		] );

		await editor.canvas.locator( 'p:text("first paragraph")' ).click();

		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'Move down' );

		// This also saves the post!
		expect( await getFootnotes( page ) ).toMatchObject( [
			{
				content: 'first footnote"',
				id: id1,
			},
			{
				content: 'second footnote',
				id: id2,
			},
		] );

		const editorPage = page;
		const previewPage = await editor.openPreviewPage();

		await expect(
			previewPage.locator( 'ol.wp-block-footnotes' )
		).toHaveText( 'first footnote” ↩︎second footnote ↩︎' );

		await previewPage.close();
		await editorPage.bringToFront();
		await editor.canvas.locator( 'p:text("first paragraph")' ).click();

		// Open revisions.
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'tab', { name: 'Post' } )
			.click();
		await page
			.locator( '.editor-private-post-last-revision__button' )
			.click();
		await page.locator( '.components-range-control__slider' ).focus();
		await page.keyboard.press( 'ArrowLeft' );
		await page.getByRole( 'button', { name: 'Restore' } ).click();

		expect( await getFootnotes( page, true ) ).toMatchObject( [
			{
				content: 'second footnote',
				id: id2,
			},
			{
				content: 'first footnote"',
				id: id1,
			},
		] );

		const previewPage2 = await editor.openPreviewPage();

		await expect(
			previewPage2.locator( 'ol.wp-block-footnotes' )
		).toHaveText( 'second footnote ↩︎first footnote” ↩︎' );

		await previewPage2.close();
		await editorPage.bringToFront();
	} );

	test( 'can be previewed when published', async ( { editor, page } ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'a' );

		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'More' );
		await page.locator( 'button:text("Footnote")' ).click();

		await page.keyboard.type( '1' );

		// Publish post with the footnote set to "1".
		const postId = await editor.publishPost();

		// Test previewing changes to meta.
		await editor.canvas.locator( 'ol.wp-block-footnotes li span' ).click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '2' );

		const editorPage = page;
		const previewPage = await editor.openPreviewPage();

		await expect(
			previewPage.locator( 'ol.wp-block-footnotes li' )
		).toHaveText( '12 ↩︎' );

		await previewPage.close();
		await editorPage.bringToFront();

		// Test again, this time with an existing revision (different code
		// path).
		await editor.canvas.locator( 'ol.wp-block-footnotes li span' ).click();
		await page.keyboard.press( 'End' );
		// Test slashing.
		await page.keyboard.type( '3"' );

		const previewPage2 = await editor.openPreviewPage();

		// Note: quote will get curled by wptexturize.
		await expect(
			previewPage2.locator( 'ol.wp-block-footnotes li' )
		).toHaveText( '123″  ↩︎' );

		// Verify that the published post is unchanged after previewing changes to meta.
		await previewPage2.close();
		await editorPage.bringToFront();
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'tab', { name: 'Post' } )
			.click();

		// Visit the published post.
		await page.goto( `/?p=${ postId }` );

		// Verify that the published post footnote still says "1".
		await expect( page.locator( 'ol.wp-block-footnotes li' ) ).toHaveText(
			'1 ↩︎'
		);
	} );

	test( 'should leave alone other block attributes', async ( {
		editor,
		page,
	} ) => {
		await page.evaluate( () => {
			window.wp.blocks.registerBlockType( 'core/test-block-string', {
				apiVersion: 3,
				title: 'Block with string attribute',
				attributes: { string: { type: 'string' } },
				edit: () => null,
				save: () => null,
			} );
		} );
		await editor.insertBlock( {
			name: 'core/test-block-string',
			attributes: { string: 'a\nb' },
		} );

		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'a' );
		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'More' );
		await page.locator( 'button:text("Footnote")' ).click();
		await page.keyboard.type( '1' );

		expect( ( await editor.getBlocks() )[ 0 ] ).toMatchObject( {
			name: 'core/test-block-string',
			// This should NOT be 'a<br>b'!
			attributes: { string: 'a\nb' },
		} );
	} );
} );

test.describe( 'Footnotes meta written by something else', () => {
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	// A plugin, an import, or a direct database edit can leave the meta
	// malformed or holding something other than an array. Parsing it unguarded
	// threw inside a store subscriber, where no error boundary catches it, so
	// the edit never reached core-data: the keystroke showed on screen, the
	// post never became dirty, and the work was lost with no notice at all.
	test( 'does not stop the post from saving', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/posts',
			data: {
				title: 'Malformed footnotes meta',
				status: 'draft',
				meta: { footnotes: 'null' },
			},
		} );

		// Guard the fixture itself: without unfiltered_html the value is
		// sanitized away, and the test would pass for the wrong reason.
		expect( post.meta.footnotes ).toBe( 'null' );

		await admin.editPost( post.id );
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'a paragraph' );

		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save draft' } )
		).toBeEnabled();

		await editor.saveDraft();

		const saved = await requestUtils.rest( {
			path: `/wp/v2/posts/${ post.id }`,
			params: { context: 'edit' },
		} );
		expect( saved.content.raw ).toContain( 'a paragraph' );
	} );
} );
