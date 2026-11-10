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

	test( 'changes and resets the button position', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/search' } );
		await editor.openDocumentSettingsSidebar();

		const position = page.getByRole( 'combobox', {
			name: 'Button position',
			exact: true,
		} );
		await expect( position ).toHaveText( 'Button outside' );

		await position.click();
		await page
			.getByRole( 'option', { name: 'Button only', exact: true } )
			.click();
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ attributes: { buttonPosition: 'button-only' } },
			] );
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Search' } )
		).toHaveClass( /wp-block-search__button-only/ );

		await page
			.getByRole( 'button', { name: 'Settings options', exact: true } )
			.click();
		await page
			.getByRole( 'menuitem', {
				name: 'Button position, reset to default',
				exact: true,
			} )
			.click();
		await expect( position ).toHaveText( 'Button outside' );
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ attributes: { buttonPosition: 'button-outside' } },
			] );

		await position.click();
		await page
			.getByRole( 'option', { name: 'No button', exact: true } )
			.click();
		await expect(
			page.getByRole( 'checkbox', { name: 'Use button with icon' } )
		).toHaveCount( 0 );
		await page
			.getByRole( 'button', { name: 'Settings options', exact: true } )
			.click();
		await page
			.getByRole( 'menuitem', { name: 'Reset all', exact: true } )
			.click();
		await expect( position ).toHaveText( 'Button outside' );
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ attributes: { buttonPosition: 'button-outside' } },
			] );
	} );

	test( 'changes the HTML element, restores Default, and announces only changed selections', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/search' } );
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'button', { name: 'Advanced', exact: true } )
			.click();

		const htmlElement = page.getByRole( 'combobox', {
			name: 'HTML element',
			exact: true,
		} );
		const defaultHelp =
			'Lets the theme decide. Uses the <search> landmark element if the theme opts in, otherwise a <form>.';
		const searchHelp =
			'Wraps the block in a <search> landmark, announced as a search region by assistive technologies.';
		const formHelp =
			'Uses a <form role="search"> wrapper for backward compatibility with existing theme styles.';
		const announcement = page.locator( '#a11y-speak-polite' );

		await expect( htmlElement ).toHaveText( 'Default' );
		await expect( htmlElement ).toHaveAccessibleDescription( defaultHelp );
		await htmlElement.click();
		await expect(
			page.getByRole( 'option', { name: 'Default', exact: true } )
		).toHaveAttribute( 'aria-selected', 'true' );
		await page
			.getByRole( 'option', { name: '<search>', exact: true } )
			.click();
		await expect( htmlElement ).toHaveAccessibleDescription( searchHelp );
		await expect( announcement ).toHaveText(
			searchHelp.replace( /[<>]/g, '' )
		);
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { attributes: { tagName: 'search' } } ] );

		// Repeating an announcement clears and rewrites the live region, even
		// when the final text is identical. Observe those changes directly.
		await announcement.evaluate( ( element ) => {
			window.searchAnnouncements = [];
			window.searchAnnouncementObserver = new MutationObserver( () => {
				window.searchAnnouncements.push( element.textContent );
			} );
			window.searchAnnouncementObserver.observe( element, {
				childList: true,
				subtree: true,
				characterData: true,
			} );
		} );
		await htmlElement.click();
		await page
			.getByRole( 'option', { name: '<search>', exact: true } )
			.click();
		await expect( htmlElement ).toHaveAttribute( 'aria-expanded', 'false' );
		expect(
			await page.evaluate( () => {
				window.searchAnnouncementObserver.disconnect();
				return window.searchAnnouncements;
			} )
		).toEqual( [] );

		await page.mouse.move( 0, 0 );
		await expect( page.getByRole( 'listbox' ) ).toBeHidden();
		await htmlElement.press( 'Space' );
		await expect( page.getByRole( 'listbox' ) ).toBeVisible();
		await page.keyboard.press( 'End' );
		await expect(
			page.getByRole( 'option', { name: '<form>', exact: true } )
		).toBeFocused();
		await page.keyboard.press( 'Enter' );
		await expect( htmlElement ).toHaveText( '<form>' );
		await expect( htmlElement ).toHaveAccessibleDescription( formHelp );
		await expect( announcement ).toHaveText(
			formHelp.replace( /[<>]/g, '' )
		);

		await page.mouse.move( 0, 0 );
		await expect( page.getByRole( 'listbox' ) ).toBeHidden();
		await htmlElement.press( 'Space' );
		await expect( page.getByRole( 'listbox' ) ).toBeVisible();
		await page.keyboard.press( 'Home' );
		await expect(
			page.getByRole( 'option', { name: 'Default', exact: true } )
		).toBeFocused();
		await page.keyboard.press( 'Enter' );
		await expect( htmlElement ).toHaveText( 'Default' );
		await expect( htmlElement ).toHaveAccessibleDescription( defaultHelp );
		await expect( announcement ).toHaveText(
			defaultHelp.replace( /[<>]/g, '' )
		);
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { attributes: { tagName: '' } } ] );
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
