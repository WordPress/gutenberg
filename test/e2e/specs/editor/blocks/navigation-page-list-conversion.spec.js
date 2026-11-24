const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const META_KEY = 'wp_navigation_auto_add_pages';

const MENU_CONTENT =
	'<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /--><!-- wp:page-list /-->';

test.use( {
	pageListMenu: async ( { admin, editor, page, requestUtils }, use ) => {
		await use( new PageListMenu( { admin, editor, page, requestUtils } ) );
	},
} );

test.describe( 'Navigation block: Page List converts to links on edit', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
		// `deleteAllPages()` deletes one page of 100 results, and one test
		// creates 101 pages.
		await requestUtils.deleteAllPages();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test( 'shows the pages as Page Links and selecting one changes nothing', async ( {
		editor,
		pageListMenu,
	} ) => {
		const menu = await pageListMenu.setUp();

		const pageList = editor.canvas.getByRole( 'document', {
			name: 'Block: Page List',
		} );
		await pageListMenu.selectLink( 'Bravo' );
		await expect
			.poll( () => pageListMenu.getSelectedLabel() )
			.toBe( 'Bravo' );

		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( {
				pageLists: 1,
				autoAdd: false,
				hasEdits: false,
			} );
		await expect( pageList ).toBeVisible();
	} );

	test( 'outside a Navigation block, clicking a page selects the Page List', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createPage( { title: 'Alpha', status: 'publish' } );
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/page-list' } );
		const pageList = editor.canvas.getByRole( 'document', {
			name: 'Block: Page List',
		} );
		await expect( pageList.getByText( 'Alpha' ) ).toBeVisible( {
			timeout: 10000,
		} );
		// Select something else first, so the click is not on a selected list.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.click();

		await pageList
			.getByRole( 'listitem' )
			.filter( { hasText: 'Alpha' } )
			.click();

		await expect
			.poll( () =>
				page.evaluate( () => {
					const blockEditor =
						window.wp.data.select( 'core/block-editor' );
					const clientId = blockEditor.getSelectedBlockClientId();
					return clientId && blockEditor.getBlockName( clientId );
				} )
			)
			.toBe( 'core/page-list' );
	} );

	test( 'a Page List that cannot be converted stays a Page List', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		await requestUtils.createPage( { title: 'Alpha', status: 'publish' } );
		// Locked against removal, so it can't be replaced by links.
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Locked menu',
			content: '<!-- wp:page-list {"lock":{"remove":true}} /-->',
		} );
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: { ref: menu.id },
		} );

		const pageList = editor.canvas.getByRole( 'document', {
			name: 'Block: Page List',
		} );
		await expect( pageList.getByText( 'Alpha' ) ).toBeVisible( {
			timeout: 10000,
		} );
		await expect(
			pageList.getByRole( 'document', { name: 'Block: Page Link' } )
		).toHaveCount( 0 );
	} );

	test( 'a Page List in a Navigation block without a menu stays a Page List', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		await requestUtils.createPage( { title: 'Alpha', status: 'publish' } );
		await admin.createNewPost();
		// No menu to switch "Auto add new pages" on for.
		await editor.insertBlock( {
			name: 'core/navigation',
			innerBlocks: [ { name: 'core/page-list' } ],
		} );

		const pageList = editor.canvas.getByRole( 'document', {
			name: 'Block: Page List',
		} );
		await expect( pageList.getByText( 'Alpha' ) ).toBeVisible( {
			timeout: 10000,
		} );
		await expect(
			pageList.getByRole( 'document', { name: 'Block: Page Link' } )
		).toHaveCount( 0 );
	} );

	test( 'a Page List in a submenu only takes what the submenu takes', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createPage( { title: 'Alpha', status: 'publish' } );
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Submenu menu',
			content:
				'<!-- wp:navigation-submenu {"label":"More","url":"https://example.com/more","kind":"custom"} --><!-- wp:page-list /--><!-- /wp:navigation-submenu -->',
		} );
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: { ref: menu.id },
		} );
		// The submenu's items are hidden until it opens, so wait on the store.
		await expect
			.poll(
				() =>
					page.evaluate( () => {
						const blockEditor =
							window.wp.data.select( 'core/block-editor' );
						const [ pageList ] =
							blockEditor.getBlocksByName( 'core/page-list' );
						return pageList
							? blockEditor
									.getBlockOrder( pageList )
									.map( blockEditor.getBlockName )
							: [];
					} ),
				{ timeout: 10000 }
			)
			.toEqual( [ 'core/navigation-link' ] );

		const allowed = await page.evaluate( () => {
			const blockEditor = window.wp.data.select( 'core/block-editor' );
			const [ pageList ] =
				blockEditor.getBlocksByName( 'core/page-list' );
			return {
				link: blockEditor.canInsertBlockType(
					'core/navigation-link',
					pageList
				),
				// A submenu doesn't take a Spacer, so its Page List can't.
				spacer: blockEditor.canInsertBlockType(
					'core/spacer',
					pageList
				),
			};
		} );
		expect( allowed ).toEqual( { link: true, spacer: false } );
	} );

	test( 'page links use the menu colors, not the submenu colors', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		await requestUtils.createPage( { title: 'Alpha', status: 'publish' } );
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Colored menu',
			content: MENU_CONTENT,
		} );
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: {
				ref: menu.id,
				customTextColor: '#00ff00',
				customOverlayTextColor: '#ff0000',
			},
		} );

		const color = ( label ) =>
			editor.canvas
				.getByRole( 'textbox', { name: 'Navigation link text' } )
				.filter( { hasText: label } )
				.evaluate(
					( element ) => window.getComputedStyle( element ).color
				);
		await expect
			.poll( () => color( 'Alpha' ), { timeout: 10000 } )
			.toBe( await color( 'Home' ) );
	} );

	test( 'moving a link within the list converts it', async ( {
		editor,
		pageListMenu,
	} ) => {
		const menu = await pageListMenu.setUp();

		await pageListMenu.selectLink( 'Bravo' );
		await editor.clickBlockToolbarButton( 'Move left' );

		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( {
				pageLists: 0,
				autoAdd: true,
				labels: [ 'Home', 'Bravo', 'Alpha', 'Charlie' ],
			} );
	} );

	test( 'moving a link out of the list converts it', async ( {
		pageListMenu,
	} ) => {
		const menu = await pageListMenu.setUp();

		// Dragging in List View lands here; dispatch the move directly.
		await pageListMenu.moveOutOfList( 'Charlie', 0 );

		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( {
				pageLists: 0,
				autoAdd: true,
				labels: [ 'Charlie', 'Home', 'Alpha', 'Bravo' ],
			} );
	} );

	test( 'dropping a link into the list converts it', async ( {
		pageListMenu,
	} ) => {
		const menu = await pageListMenu.setUp();

		await pageListMenu.moveIntoList( 'Home', 1 );

		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( {
				pageLists: 0,
				autoAdd: true,
				labels: [ 'Alpha', 'Home', 'Bravo', 'Charlie' ],
			} );
	} );

	test( 'a link dragged by its toolbar handle drops between the pages', async ( {
		editor,
		page,
		pageListMenu,
	} ) => {
		const menu = await pageListMenu.setUp();

		await editor.canvas
			.getByRole( 'textbox', { name: 'Navigation link text' } )
			.filter( { hasText: 'Home' } )
			.click();
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Drag', includeHidden: true } )
			.hover();
		await page.mouse.down();

		// Over the leading edge of Bravo, in the menu's row.
		const bravo = await editor.canvas
			.getByRole( 'document', { name: 'Block: Page Link' } )
			.filter( { hasText: 'Bravo' } )
			.boundingBox();
		// Playwright needs two moves before every browser fires `dragover`.
		for ( let i = 0; i < 2; i += 1 ) {
			await page.mouse.move( bravo.x + 2, bravo.y + bravo.height / 2 );
		}
		await expect(
			page.getByTestId( 'block-list-insertion-point-indicator' )
		).toBeVisible();
		await page.mouse.up();

		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( {
				pageLists: 0,
				autoAdd: true,
				labels: [ 'Alpha', 'Home', 'Bravo', 'Charlie' ],
			} );
	} );

	test( 'removing a link converts the list', async ( {
		editor,
		pageListMenu,
	} ) => {
		const menu = await pageListMenu.setUp();

		await pageListMenu.selectLink( 'Bravo' );
		await editor.clickBlockOptionsMenuItem( 'Delete' );

		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( {
				pageLists: 0,
				autoAdd: true,
				labels: [ 'Home', 'Alpha', 'Charlie' ],
			} );
	} );

	test( 'deleting the first page selects the link before the list', async ( {
		editor,
		pageListMenu,
	} ) => {
		const menu = await pageListMenu.setUp();

		await pageListMenu.selectLink( 'Alpha' );
		await editor.clickBlockOptionsMenuItem( 'Delete' );

		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( {
				pageLists: 0,
				labels: [ 'Home', 'Bravo', 'Charlie' ],
			} );
		await expect
			.poll( () => pageListMenu.getSelectedLabel() )
			.toBe( 'Home' );
	} );

	test( 'adding a link after one in the list converts it', async ( {
		editor,
		pageListMenu,
	} ) => {
		const menu = await pageListMenu.setUp();

		await pageListMenu.selectLink( 'Bravo' );
		await editor.clickBlockOptionsMenuItem( 'Add after' );

		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( {
				pageLists: 0,
				autoAdd: true,
				// The new link has no label yet.
				labels: [ 'Home', 'Alpha', 'Bravo', undefined, 'Charlie' ],
			} );
	} );

	test( 'editing a label converts the list', async ( {
		page,
		pageListMenu,
	} ) => {
		const menu = await pageListMenu.setUp();

		await pageListMenu.selectLink( 'Bravo' );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' Team' );

		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( {
				pageLists: 0,
				autoAdd: true,
				labels: [ 'Home', 'Alpha', 'Bravo Team', 'Charlie' ],
			} );
	} );

	// The Page List's inner block controller cleans up when it unmounts,
	// between two keystrokes, which starts a new undo step. Fixed by #82706.
	test.fixme( 'one undo reverts typing a label and the conversion', async ( {
		page,
		pageListMenu,
	} ) => {
		const menu = await pageListMenu.setUp();

		await pageListMenu.selectLink( 'Bravo' );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' Team' );
		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( {
				labels: [ 'Home', 'Alpha', 'Bravo Team', 'Charlie' ],
			} );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Undo', exact: true } )
			.click();
		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( {
				pageLists: 1,
				autoAdd: false,
				labels: [ 'Home', 'Alpha', 'Bravo', 'Charlie' ],
			} );
	} );

	test( 'one undo brings the Page List back and turns auto add off', async ( {
		editor,
		page,
		pageListMenu,
	} ) => {
		const menu = await pageListMenu.setUp();

		await pageListMenu.selectLink( 'Bravo' );
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( { pageLists: 0, autoAdd: true } );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Undo', exact: true } )
			.click();

		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( {
				pageLists: 1,
				autoAdd: false,
				labels: [ 'Home', 'Alpha', 'Bravo', 'Charlie' ],
			} );
	} );

	test( 'undo and redo take a link moved out of the list in one step', async ( {
		page,
		pageListMenu,
	} ) => {
		const menu = await pageListMenu.setUp();
		const converted = {
			pageLists: 0,
			autoAdd: true,
			labels: [ 'Charlie', 'Home', 'Alpha', 'Bravo' ],
		};

		// The move changes the menu's own items as well as the list's.
		await pageListMenu.moveOutOfList( 'Charlie', 0 );
		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( converted );

		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		await topBar
			.getByRole( 'button', { name: 'Undo', exact: true } )
			.click();
		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( {
				pageLists: 1,
				autoAdd: false,
				labels: [ 'Home', 'Alpha', 'Bravo', 'Charlie' ],
			} );

		await topBar
			.getByRole( 'button', { name: 'Redo', exact: true } )
			.click();
		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( converted );
	} );

	test( 'with more than 100 pages the list stays a Page List', async ( {
		editor,
		pageListMenu,
		requestUtils,
	} ) => {
		const titles = Array.from(
			{ length: 101 },
			( _, index ) => `Page ${ index }`
		);
		for ( let i = 0; i < titles.length; i += 20 ) {
			await Promise.all(
				titles
					.slice( i, i + 20 )
					.map( ( title ) =>
						requestUtils.createPage( { title, status: 'publish' } )
					)
			);
		}
		await pageListMenu.openMenu();

		const pageList = editor.canvas.getByRole( 'document', {
			name: 'Block: Page List',
		} );
		await expect( pageList.locator( 'li' ).first() ).toBeVisible( {
			timeout: 10000,
		} );
		await expect(
			pageList.getByRole( 'document', { name: 'Block: Page Link' } )
		).toHaveCount( 0 );
	} );

	test( 'after converting and saving, a new page is added at the end', async ( {
		editor,
		page,
		pageListMenu,
		requestUtils,
	} ) => {
		const menu = await pageListMenu.setUp();

		await pageListMenu.selectLink( 'Bravo' );
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		await expect
			.poll( () => pageListMenu.getState( menu.id ) )
			.toMatchObject( { pageLists: 0, autoAdd: true } );

		await page.evaluate(
			( id ) =>
				window.wp.data
					.dispatch( 'core' )
					.saveEditedEntityRecord( 'postType', 'wp_navigation', id ),
			menu.id
		);

		const delta = await requestUtils.createPage( {
			title: 'Delta',
			status: 'publish',
			menu_order: 0,
		} );
		const saved = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menu.id }`,
			params: { context: 'edit' },
		} );
		expect( saved.meta[ META_KEY ] ).toBe( true );
		expect( saved.content.raw ).not.toContain( 'wp:page-list' );
		const content = saved.content.raw;
		expect( content.indexOf( `"id":${ delta.id }` ) ).toBeGreaterThan(
			content.indexOf( '"label":"Charlie"' )
		);
	} );
} );

class PageListMenu {
	constructor( { admin, editor, page, requestUtils } ) {
		this.admin = admin;
		this.editor = editor;
		this.page = page;
		this.requestUtils = requestUtils;
	}

	async setUp() {
		for ( const [ index, title ] of [
			'Alpha',
			'Bravo',
			'Charlie',
		].entries() ) {
			await this.requestUtils.createPage( {
				title,
				status: 'publish',
				menu_order: index + 1,
			} );
		}
		const menu = await this.openMenu();
		await expect(
			this.editor.canvas
				.getByRole( 'document', { name: 'Block: Page List' } )
				.getByRole( 'document', { name: 'Block: Page Link' } )
		).toHaveCount( 3, { timeout: 10000 } );
		return menu;
	}

	// One click, like the menu's other links: the Page List has no overlay
	// of its own. The Navigation block is already selected after insertion.
	async selectLink( label ) {
		await this.editor.canvas
			.getByRole( 'document', { name: 'Block: Page List' } )
			.getByRole( 'textbox', { name: 'Navigation link text' } )
			.filter( { hasText: label } )
			.click();
	}

	async getSelectedLabel() {
		return this.page.evaluate( () => {
			const blockEditor = window.wp.data.select( 'core/block-editor' );
			const clientId = blockEditor.getSelectedBlockClientId();
			return clientId
				? blockEditor.getBlockAttributes( clientId ).label
				: null;
		} );
	}

	async openMenu() {
		const menu = await this.requestUtils.createNavigationMenu( {
			title: 'Page List menu',
			content: MENU_CONTENT,
		} );
		await this.admin.createNewPost();
		await this.editor.insertBlock( {
			name: 'core/navigation',
			attributes: { ref: menu.id },
		} );
		return menu;
	}

	async getState( menuId ) {
		return this.page.evaluate(
			( { id, metaKey } ) => {
				const blockEditor =
					window.wp.data.select( 'core/block-editor' );
				const core = window.wp.data.select( 'core' );
				const [ navigationId ] =
					blockEditor.getBlocksByName( 'core/navigation' );
				const labels = ( blocks ) =>
					blocks.flatMap( ( block ) =>
						block.name === 'core/page-list'
							? // Controlled inner blocks are left out of the
								// parent's tree, so read them from the list.
								labels(
									blockEditor.getBlocks( block.clientId )
								)
							: [ block.attributes.label ]
					);
				return {
					pageLists:
						blockEditor.getBlocksByName( 'core/page-list' ).length,
					autoAdd: !! core.getEditedEntityRecord(
						'postType',
						'wp_navigation',
						id
					)?.meta?.[ metaKey ],
					hasEdits: core.hasEditsForEntityRecord(
						'postType',
						'wp_navigation',
						id
					),
					labels: labels( blockEditor.getBlocks( navigationId ) ),
				};
			},
			{ id: menuId, metaKey: META_KEY }
		);
	}

	async moveOutOfList( label, index ) {
		await this.page.evaluate(
			( { linkLabel, toIndex } ) => {
				const blockEditor =
					window.wp.data.select( 'core/block-editor' );
				const [ navigationId ] =
					blockEditor.getBlocksByName( 'core/navigation' );
				const [ pageListId ] =
					blockEditor.getBlocksByName( 'core/page-list' );
				const link = blockEditor
					.getBlocks( pageListId )
					.find( ( block ) => block.attributes.label === linkLabel );
				window.wp.data
					.dispatch( 'core/block-editor' )
					.moveBlocksToPosition(
						[ link.clientId ],
						pageListId,
						navigationId,
						toIndex
					);
			},
			{ linkLabel: label, toIndex: index }
		);
	}

	async moveIntoList( label, index ) {
		await this.page.evaluate(
			( { linkLabel, toIndex } ) => {
				const blockEditor =
					window.wp.data.select( 'core/block-editor' );
				const [ navigationId ] =
					blockEditor.getBlocksByName( 'core/navigation' );
				const [ pageListId ] =
					blockEditor.getBlocksByName( 'core/page-list' );
				const link = blockEditor
					.getBlocks( navigationId )
					.find( ( block ) => block.attributes.label === linkLabel );
				window.wp.data
					.dispatch( 'core/block-editor' )
					.moveBlocksToPosition(
						[ link.clientId ],
						navigationId,
						pageListId,
						toIndex
					);
			},
			{ linkLabel: label, toIndex: index }
		);
	}
}
