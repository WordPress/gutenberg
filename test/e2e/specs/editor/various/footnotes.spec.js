/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function getFootnotes( page ) {
	// Save post so we can check meta.
	await page.click( 'button:text("Save draft")' );
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'first paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'second paragraph' );

		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'More' );
		await page.locator( 'button:text("Footnote")' ).click();

		await page.keyboard.type( 'first footnote' );

		const id1 = await editor.canvas.evaluate( () => {
			return document.activeElement.id;
		} );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'first paragraph' },
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: `second paragraph<a data-rich-text-format-boundary="true" href="#${ id1 }" id="${ id1 }-link" data-fn="${ id1 }" class="fn">*</a>`,
				},
			},
			{
				name: 'core/footnotes',
			},
		] );

		await editor.canvas.click( 'p:text("first paragraph")' );

		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'More' );
		await page.locator( 'button:text("Footnote")' ).click();

		await page.keyboard.type( 'second footnote' );

		const id2 = await editor.canvas.evaluate( () => {
			return document.activeElement.id;
		} );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: `first paragraph<a data-rich-text-format-boundary="true" href="#${ id2 }" id="${ id2 }-link" data-fn="${ id2 }" class="fn">*</a>`,
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: `second paragraph<a data-rich-text-format-boundary="true" href="#${ id1 }" id="${ id1 }-link" data-fn="${ id1 }" class="fn">*</a>`,
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

		await editor.canvas.click( 'p:text("first paragraph")' );

		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'Move down' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: `second paragraph<a data-rich-text-format-boundary="true" href="#${ id1 }" id="${ id1 }-link" data-fn="${ id1 }" class="fn">*</a>`,
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: `first paragraph<a data-rich-text-format-boundary="true" href="#${ id2 }" id="${ id2 }-link" data-fn="${ id2 }" class="fn">*</a>`,
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

		await editor.canvas.click( `a[href="#${ id2 }-link"]` );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: `second paragraph<a data-rich-text-format-boundary="true" href="#${ id1 }" id="${ id1 }-link" data-fn="${ id1 }" class="fn">*</a>`,
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

		await editor.canvas.click( `a[href="#${ id1 }-link"]` );
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
} );
