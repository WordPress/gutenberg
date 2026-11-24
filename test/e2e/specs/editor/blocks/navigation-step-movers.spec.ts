import type { Page } from '@playwright/test';
import {
	test as base,
	expect,
	type Admin,
	type Editor,
	type RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';

const META_KEY = 'wp_navigation_auto_add_pages';

const link = ( label: string ) =>
	`<!-- wp:navigation-link {"label":"${ label }","url":"https://example.com/${ label.toLowerCase() }","kind":"custom"} /-->`;

// `requestUtils.createPage()` takes no menu order or parent page.
function publishPage(
	requestUtils: RequestUtils,
	page: { title: string; menu_order?: number; parent?: number }
) {
	return requestUtils.rest< { id: number } >( {
		method: 'POST',
		path: '/wp/v2/pages',
		data: { ...page, status: 'publish' },
	} );
}

type Utils = {
	admin: Admin;
	editor: Editor;
	page: Page;
	requestUtils: RequestUtils;
};

const test = base.extend< { menuUtils: MenuUtils } >( {
	menuUtils: async ( { admin, editor, page, requestUtils }, use ) => {
		await use( new MenuUtils( { admin, editor, page, requestUtils } ) );
	},
} );

test.describe( 'Navigation: moving one step', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test.describe( 'canvas arrows next to a Page List', () => {
		// The Page List shows Alpha, Charlie, and Bravo, a submenu holding
		// Bravo Team. In the canvas the pages sit in line with Home and
		// Contact, so one step moves past one page.
		const CONTENT = `${ link( 'Home' ) }<!-- wp:page-list /-->${ link(
			'Contact'
		) }`;

		test( 'Home moves right past the first page', async ( {
			editor,
			menuUtils,
		} ) => {
			const menu = await menuUtils.setUpPageListMenu( CONTENT );

			await menuUtils.selectInCanvas( 'Home' );
			await editor.clickBlockToolbarButton( 'Move right' );

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					pageLists: 0,
					autoAdd: true,
					tree: [
						'Alpha',
						'Home',
						'Charlie',
						'Bravo(Bravo Team)',
						'Contact',
					],
				} );
		} );

		test( 'the first page moves left out of the list', async ( {
			editor,
			menuUtils,
		} ) => {
			const menu = await menuUtils.setUpPageListMenu( CONTENT );

			await menuUtils.selectInCanvas( 'Alpha' );
			await editor.clickBlockToolbarButton( 'Move left' );

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					pageLists: 0,
					autoAdd: true,
					tree: [
						'Alpha',
						'Home',
						'Charlie',
						'Bravo(Bravo Team)',
						'Contact',
					],
				} );
		} );

		test( 'a link after the list moves left past the last page, not into its submenu', async ( {
			editor,
			menuUtils,
		} ) => {
			const menu = await menuUtils.setUpPageListMenu( CONTENT );

			await menuUtils.selectInCanvas( 'Contact' );
			await editor.clickBlockToolbarButton( 'Move left' );

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					pageLists: 0,
					autoAdd: true,
					tree: [
						'Home',
						'Alpha',
						'Charlie',
						'Contact',
						'Bravo(Bravo Team)',
					],
				} );
		} );

		test( 'the last page moves right past the next link', async ( {
			editor,
			menuUtils,
		} ) => {
			const menu = await menuUtils.setUpPageListMenu( CONTENT );

			await menuUtils.selectInCanvas( 'Bravo' );
			await editor.clickBlockToolbarButton( 'Move right' );

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					pageLists: 0,
					autoAdd: true,
					tree: [
						'Home',
						'Alpha',
						'Charlie',
						'Contact',
						'Bravo(Bravo Team)',
					],
				} );
		} );

		test( 'an item that is not a link moves past the first page too', async ( {
			editor,
			menuUtils,
		} ) => {
			const menu = await menuUtils.setUpPageListMenu(
				'<!-- wp:home-link {"label":"Home"} /--><!-- wp:page-list /-->'
			);

			await editor.selectBlocks(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Home Link',
				} )
			);
			await editor.clickBlockToolbarButton( 'Move right' );

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					pageLists: 0,
					tree: [ 'Alpha', 'Home', 'Charlie', 'Bravo(Bravo Team)' ],
				} );
		} );

		test( 'one undo brings the Page List back', async ( {
			editor,
			page,
			menuUtils,
		} ) => {
			const menu = await menuUtils.setUpPageListMenu( CONTENT );

			await menuUtils.selectInCanvas( 'Home' );
			await editor.clickBlockToolbarButton( 'Move right' );
			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( { pageLists: 0 } );

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Undo', exact: true } )
				.click();

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					pageLists: 1,
					autoAdd: false,
					tree: [
						'Home',
						'Page List(Alpha,Charlie,Bravo(Bravo Team))',
						'Contact',
					],
				} );
		} );

		test( 'one undo still brings the Page List back after a page is saved', async ( {
			editor,
			page,
			menuUtils,
		} ) => {
			const menu = await menuUtils.setUpPageListMenu( CONTENT );
			// Saving a page refetches the list's pages, as creating a page
			// from the link UI does.
			await page.evaluate( () =>
				window.wp.data
					.dispatch( 'core' )
					.saveEntityRecord( 'postType', 'page', {
						title: 'Delta',
						status: 'draft',
					} )
			);

			await menuUtils.selectInCanvas( 'Home' );
			await editor.clickBlockToolbarButton( 'Move right' );
			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( { pageLists: 0 } );

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Undo', exact: true } )
				.click();

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					pageLists: 1,
					tree: [
						'Home',
						'Page List(Alpha,Charlie,Bravo(Bravo Team))',
						'Contact',
					],
				} );
		} );

		test( 'one undo still brings the Page List back after its links appear later', async ( {
			editor,
			page,
			menuUtils,
		} ) => {
			const menu = await menuUtils.setUpPageListMenu( CONTENT );
			const ids = await page.evaluate( async () => {
				const pages = await window.wp.apiFetch( {
					path: '/wp/v2/pages?per_page=100&_fields=id,title',
				} );
				const byTitle = ( title: string ) =>
					pages.find(
						( p: { title: { rendered: string } } ) =>
							p.title.rendered === title
					).id;
				return { alpha: byTitle( 'Alpha' ), bravo: byTitle( 'Bravo' ) };
			} );
			// Alpha has no children, so the list shows a warning first; then
			// Bravo's child appears as its only link.
			const setParent = ( parentPageID: number ) =>
				page.evaluate( ( id ) => {
					const blockEditor =
						window.wp.data.select( 'core/block-editor' );
					const [ pageList ] =
						blockEditor.getBlocksByName( 'core/page-list' );
					window.wp.data
						.dispatch( 'core/block-editor' )
						.updateBlockAttributes( pageList, {
							parentPageID: id,
						} );
				}, parentPageID );
			await setParent( ids.alpha );
			await expect(
				editor.canvas.getByText( 'page has no children' )
			).toBeVisible();
			await setParent( ids.bravo );
			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					tree: [ 'Home', 'Page List(Bravo Team)', 'Contact' ],
				} );

			await menuUtils.selectInCanvas( 'Home' );
			await editor.clickBlockToolbarButton( 'Move right' );
			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( { pageLists: 0 } );

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Undo', exact: true } )
				.click();

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					pageLists: 1,
					tree: [ 'Home', 'Page List(Bravo Team)', 'Contact' ],
				} );
		} );
	} );

	test.describe( 'List View movers', () => {
		const CONTENT = `${ link(
			'Home'
		) }<!-- wp:navigation-submenu {"label":"Bravo","url":"https://example.com/bravo","kind":"custom"} -->${ link(
			'Team'
		) }<!-- /wp:navigation-submenu -->${ link( 'Contact' ) }`;

		test( 'moving down past an expanded submenu goes into it', async ( {
			menuUtils,
		} ) => {
			const menu = await menuUtils.openMenu( CONTENT );
			await menuUtils.openListView();

			await menuUtils.listViewMove( 'Home', 'Move down' );

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					tree: [ 'Bravo(Home,Team)', 'Contact' ],
				} );
		} );

		test( 'moving down past a collapsed submenu goes past it', async ( {
			menuUtils,
		} ) => {
			const menu = await menuUtils.openMenu( CONTENT );
			await menuUtils.openListView();
			await menuUtils.collapseListViewRow( 'Bravo' );

			await menuUtils.listViewMove( 'Home', 'Move down' );

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					tree: [ 'Bravo(Team)', 'Home', 'Contact' ],
				} );
		} );

		test( 'the first child moves up out of its submenu', async ( {
			menuUtils,
		} ) => {
			const menu = await menuUtils.openMenu( CONTENT );
			await menuUtils.openListView();

			await menuUtils.listViewMove( 'Team', 'Move up' );

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					// An emptied submenu turns back into a link.
					tree: [ 'Home', 'Team', 'Bravo', 'Contact' ],
				} );
		} );

		test( 'the last child moves down out of its submenu', async ( {
			menuUtils,
		} ) => {
			const menu = await menuUtils.openMenu( CONTENT );
			await menuUtils.openListView();

			await menuUtils.listViewMove( 'Team', 'Move down' );

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					tree: [ 'Home', 'Bravo', 'Team', 'Contact' ],
				} );
		} );

		test( 'moving down onto a Page List goes past its first page', async ( {
			menuUtils,
		} ) => {
			const menu = await menuUtils.setUpPageListMenu(
				`${ link( 'Home' ) }<!-- wp:page-list /-->`
			);
			await menuUtils.openListView();

			await menuUtils.listViewMove( 'Home', 'Move down' );

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					pageLists: 0,
					autoAdd: true,
					tree: [ 'Alpha', 'Home', 'Charlie', 'Bravo(Bravo Team)' ],
				} );
		} );

		test( 'one undo reverts a move into a submenu', async ( {
			page,
			menuUtils,
		} ) => {
			const menu = await menuUtils.openMenu( CONTENT );
			await menuUtils.openListView();
			await menuUtils.listViewMove( 'Home', 'Move down' );
			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( { tree: [ 'Bravo(Home,Team)', 'Contact' ] } );

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Undo', exact: true } )
				.click();

			await expect
				.poll( () => menuUtils.getState( menu.id ) )
				.toMatchObject( {
					tree: [ 'Home', 'Bravo(Team)', 'Contact' ],
				} );
		} );
	} );
} );

class MenuUtils {
	admin: Admin;
	editor: Editor;
	page: Page;
	requestUtils: RequestUtils;

	constructor( { admin, editor, page, requestUtils }: Utils ) {
		this.admin = admin;
		this.editor = editor;
		this.page = page;
		this.requestUtils = requestUtils;
	}

	async setUpPageListMenu( content: string ) {
		await publishPage( this.requestUtils, {
			title: 'Alpha',
			menu_order: 1,
		} );
		await publishPage( this.requestUtils, {
			title: 'Charlie',
			menu_order: 2,
		} );
		const bravo = await publishPage( this.requestUtils, {
			title: 'Bravo',
			menu_order: 3,
		} );
		await publishPage( this.requestUtils, {
			title: 'Bravo Team',
			parent: bravo.id,
		} );
		const menu = await this.openMenu( content );
		await expect(
			this.editor.canvas
				.getByRole( 'document', { name: 'Block: Page List' } )
				.getByRole( 'document', { name: 'Block: Page Link' } )
				.first()
		).toBeVisible( { timeout: 10000 } );
		return menu;
	}

	async openMenu( content: string ) {
		const menu = await this.requestUtils.createNavigationMenu( {
			title: 'Step menu',
			content,
		} );
		await this.admin.createNewPost();
		await this.editor.insertBlock( {
			name: 'core/navigation',
			attributes: { ref: menu.id },
		} );
		return menu;
	}

	// Select a link or submenu by its label, then show its toolbar.
	async selectInCanvas( label: string ) {
		await this.editor.canvas
			.getByRole( 'textbox', { name: 'Navigation link text' } )
			.filter( { hasText: new RegExp( `^${ label }$` ) } )
			.click();
	}

	async openListView() {
		await this.editor.selectBlocks(
			this.editor.canvas.getByRole( 'document', {
				name: 'Block: Navigation',
			} )
		);
		await this.editor.openDocumentSettingsSidebar();
		await this.page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'tab', { name: 'List View' } )
			.click();
	}

	listViewRow( label: string ) {
		return this.page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'treegrid' )
			.getByRole( 'row' )
			.filter( {
				has: this.page.getByRole( 'gridcell', {
					name: new RegExp( `^${ label }\\b` ),
				} ),
			} )
			.first();
	}

	async collapseListViewRow( label: string ) {
		// Focus the row without selecting the block, which would swap the
		// inspector to that block's settings.
		await this.listViewRow( label )
			.getByRole( 'gridcell' )
			.first()
			.getByRole( 'link' )
			.focus();
		await this.page.keyboard.press( 'ArrowLeft' );
	}

	async listViewMove( label: string, action: string ) {
		const row = this.listViewRow( label );
		await row.hover();
		await row.getByRole( 'button', { name: 'Options' } ).click();
		await this.page.getByRole( 'menuitem', { name: action } ).click();
	}

	async getState( menuId: number ) {
		return this.page.evaluate(
			( { id, metaKey } ) => {
				const blockEditor =
					window.wp.data.select( 'core/block-editor' );
				const core = window.wp.data.select( 'core' );
				const [ navigationId ] =
					blockEditor.getBlocksByName( 'core/navigation' );
				// Controlled inner blocks are left out of the parent's tree,
				// so read each block's children from the store.
				const tree = ( clientIds: string[] ): unknown[] =>
					clientIds.map( ( clientId ) => {
						const name = blockEditor.getBlockName( clientId );
						const children = blockEditor.getBlockOrder( clientId );
						const label =
							name === 'core/page-list'
								? 'Page List'
								: blockEditor.getBlockAttributes( clientId )
										.label;
						return name === 'core/page-list' || children.length
							? `${ label }(${ tree( children ).join( ',' ) })`
							: label;
					} );
				return {
					pageLists:
						blockEditor.getBlocksByName( 'core/page-list' ).length,
					autoAdd: !! core.getEditedEntityRecord(
						'postType',
						'wp_navigation',
						id
					)?.meta?.[ metaKey ],
					tree: tree( blockEditor.getBlockOrder( navigationId ) ),
				};
			},
			{ id: menuId, metaKey: META_KEY }
		);
	}
}
