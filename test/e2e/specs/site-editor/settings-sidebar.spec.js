/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	siteBarFunction: async ( { page }, use ) => {
		await use( new Sitebar( { page } ) );
	},
} );
test.describe( 'Settings sidebar', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor();
	} );

	test( 'should open template tab by default if no block is selected', async ( {
		page,
	} ) => {
		// Toggle Sidebar
		await page.click(
			'.edit-site-header-edit-mode__actions button[aria-label="Settings"]'
		);
		const elements = page.locator(
			'.edit-site-sidebar-edit-mode__panel-tab.is-active'
		);
		await expect( elements ).toContainText( 'Template' );
	} );
	test( "should show the currently selected template's title and description", async ( {
		page,
		admin,
		siteBarFunction,
	} ) => {
		// Toggle Sidebar
		await page.click(
			'.edit-site-header-edit-mode__actions button[aria-label="Settings"]'
		);
		const templateCardBeforeNavigation =
			await siteBarFunction.getTemplateCard();
		await admin.visitSiteEditor( {
			postId: 'emptytheme//singular',
			postType: 'wp_template',
		} );
		const templateCardAfterNavigation =
			await siteBarFunction.getTemplateCard();
		expect( templateCardBeforeNavigation ).toMatchObject( {
			title: 'Index',
			description: 'Displays posts.',
		} );
		expect( templateCardAfterNavigation ).toMatchObject( {
			title: 'Singular',
			description: 'Displays a single post or page.',
		} );
	} );
	test( 'should open block tab by default if a block is selected', async ( {
		page,
		siteBarFunction,
	} ) => {
		const allBlocks = await siteBarFunction.getAllBlocks();
		await siteBarFunction.selectBlockByClientId( allBlocks[ 0 ].clientId );
		await siteBarFunction.toggleSidebar();

		const elements = page.locator(
			'.edit-site-sidebar-edit-mode__panel-tab.is-active'
		);
		await expect( elements ).toContainText( 'Block' );
	} );

	test( 'should switch to block tab if we select a block, when Template is selected', async ( {
		page,
		editor,
	} ) => {
		await page.click(
			'.edit-site-header-edit-mode__actions button[aria-label="Settings"]'
		);
		const element = page.locator(
			'.edit-site-sidebar-edit-mode__panel-tab.is-active'
		);
		await expect( element ).not.toBeNull();
		// By inserting the block is also selected.
		await editor.insertBlock( { name: 'core/heading' } );

		const elements = page.locator(
			'.edit-site-sidebar-edit-mode__panel-tab.is-active'
		);
		await expect( elements ).not.toBeNull();
	} );
	test( 'should switch to Template tab when a block was selected and we select the Template', async ( {
		page,
		siteBarFunction,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/heading' } );
		await siteBarFunction.toggleSidebar();
		const element = page.locator(
			'.edit-site-sidebar-edit-mode__panel-tab.is-active'
		);
		await expect( element ).toContainText( 'Block' );
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		} );
		const elements = page.locator(
			'.edit-site-sidebar-edit-mode__panel-tab.is-active'
		);
		await expect( elements ).toContainText( 'Template' );
	} );
} );

class Sitebar {
	constructor( { page } ) {
		this.page = page;
	}

	async selectBlockByClientId( clientId ) {
		await this.page.evaluate( ( id ) => {
			window.wp.data.dispatch( 'core/block-editor' ).selectBlock( id );
		}, clientId );
	}
	async toggleSidebar() {
		await this.page.click(
			'.edit-site-header-edit-mode__actions button[aria-label="Settings"]'
		);
	}

	async getAllBlocks() {
		return this.page.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			return JSON.parse( JSON.stringify( blocks ) );
		} );
	}
	async getTemplateCard() {
		const locator1 = this.page.locator( '.edit-site-template-card__title' );
		const locator2 = this.page.locator(
			'.edit-site-template-card__description'
		);
		return {
			title: await locator1.evaluate( ( node ) => node.innerText ),
			description: await locator2.evaluate( ( node ) => node.innerText ),
		};
	}
}
