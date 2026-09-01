const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Search', () => {
	test.beforeEach( async ( { admin, requestUtils } ) => {
		await requestUtils.deleteAllMenus();
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMenus();
	} );

	test( 'applies the width to the inside wrapper verbatim, whatever the unit', async ( {
		editor,
	} ) => {
		// The width used to be handed to a ResizableBox, which appended `px`
		// to any unit it did not recognise and turned `20em` into `20empx`.
		await editor.insertBlock( {
			name: 'core/search',
			attributes: { style: { dimensions: { width: '20em' } } },
		} );

		const wrapper = editor.canvas.locator(
			'.wp-block-search__inside-wrapper'
		);

		await expect( wrapper ).toHaveAttribute( 'style', /width:\s*20em/ );
	} );

	test( 'leaves the width alone when the block has none set', async ( {
		editor,
	} ) => {
		// An inline width of `auto` would override anything coming from
		// Global Styles or the stylesheet.
		await editor.insertBlock( { name: 'core/search' } );

		const wrapper = editor.canvas.locator(
			'.wp-block-search__inside-wrapper'
		);

		await expect( wrapper ).not.toHaveAttribute( 'style', /width:/ );
	} );

	test( 'stores a pixel width after dragging the resize handle', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/search',
			attributes: { style: { dimensions: { width: '300px' } } },
		} );

		const searchBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Search',
		} );
		await searchBlock.click();

		const handle = editor.canvas.locator(
			'.components-resizable-box__handle-right'
		);
		await expect( handle ).toBeVisible();

		const handleBox = await handle.boundingBox();
		await page.mouse.move(
			handleBox.x + handleBox.width / 2,
			handleBox.y + handleBox.height / 2
		);
		await page.mouse.down();
		await page.mouse.move(
			handleBox.x + handleBox.width / 2 - 100,
			handleBox.y + handleBox.height / 2,
			{ steps: 10 }
		);
		await page.mouse.up();

		const [ block ] = await editor.getBlocks();
		expect( block.attributes.style.dimensions.width ).toMatch( /^\d+px$/ );
		expect(
			parseInt( block.attributes.style.dimensions.width, 10 )
		).toBeLessThan( 300 );
	} );

	test( 'should auto-configure itself to sensible defaults when inserted into a Navigation block', async ( {
		page,
		editor,
		requestUtils,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Test Menu',
			content: `<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->`,
		} );

		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: {
				ref: createdMenu?.id,
			},
		} );

		const navBlockInserter = editor.canvas
			.getByRole( 'document', { name: 'Block: Navigation' } )
			.getByRole( 'button', { name: 'Add page' } );
		await navBlockInserter.click();

		await page
			.getByRole( 'button', { name: 'Add block' } )
			.filter( { hasText: 'Add block' } )
			.first()
			.click();

		// Click on the Search block option.
		await page.getByRole( 'option', { name: 'Search' } ).click();

		// Expect to see the Search block.
		const searchBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Search',
		} );

		await expect( searchBlock ).toBeVisible();

		// The only way to access the inner controlled blocks of the Navigation block
		// is to access the edited entity record for the associated Navigation Menu record.
		const editedMenuRecord = await page.evaluate( ( menuId ) => {
			return window.wp.data
				.select( 'core' )
				.getEditedEntityRecord( 'postType', 'wp_navigation', menuId );
		}, createdMenu?.id );

		// The 2nd block in the Navigation block is the Search block.
		const searchBlockAttributes = editedMenuRecord.blocks[ 1 ].attributes;

		expect( searchBlockAttributes ).toMatchObject( {
			showLabel: false,
			buttonUseIcon: true,
			buttonPosition: 'button-inside',
		} );
	} );
} );
