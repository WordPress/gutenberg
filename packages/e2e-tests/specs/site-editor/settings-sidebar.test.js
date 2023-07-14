/**
 * WordPress dependencies
 */
import {
	deleteAllTemplates,
	activateTheme,
	getAllBlocks,
	selectBlockByClientId,
	insertBlock,
	visitSiteEditor,
	enterEditMode,
} from '@wordpress/e2e-test-utils';

async function toggleSidebar() {
	await page.click(
		'.edit-site-header-edit-mode__actions button[aria-label="Settings"]'
	);
}

async function getActiveTabLabel() {
	return await page.$eval(
		'.edit-site-sidebar-edit-mode__panel-tab.is-active',
		( element ) => element.getAttribute( 'aria-label' )
	);
}

async function getTemplateCard() {
	return {
		title: await page.$eval(
			'.edit-site-sidebar-card__title',
			( element ) => element.innerText
		),
		description: await page.$eval(
			'.edit-site-sidebar-card__description',
			( element ) => element.innerText
		),
	};
}

describe( 'Settings sidebar', () => {
	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		await deleteAllTemplates( 'wp_template' );
		await deleteAllTemplates( 'wp_template_part' );
	} );
	afterAll( async () => {
		await deleteAllTemplates( 'wp_template' );
		await deleteAllTemplates( 'wp_template_part' );
		await activateTheme( 'twentytwentyone' );
	} );
	beforeEach( async () => {
		await visitSiteEditor();
		await enterEditMode();
	} );

	describe( 'Template tab', () => {
		it( 'should open template tab by default if no block is selected', async () => {
			await toggleSidebar();

			expect( await getActiveTabLabel() ).toEqual(
				'Template (selected)'
			);
		} );

		it( "should show the currently selected template's title and description", async () => {
			await toggleSidebar();

			const templateCardBeforeNavigation = await getTemplateCard();
			await visitSiteEditor( {
				postId: 'emptytheme//singular',
				postType: 'wp_template',
			} );
			await enterEditMode();
			const templateCardAfterNavigation = await getTemplateCard();

			expect( templateCardBeforeNavigation ).toMatchObject( {
				title: 'Index',
				description:
					'Used as a fallback template for all pages when a more specific template is not defined.',
			} );
			expect( templateCardAfterNavigation ).toMatchObject( {
				title: 'Single Entries',
				description:
					'Displays any single entry, such as a post or a page. This template will serve as a fallback when a more specific template (e.g., Single Post, Page, or Attachment) cannot be found.',
			} );
		} );
	} );

	describe( 'Block tab', () => {
		it( 'should open block tab by default if a block is selected', async () => {
			const allBlocks = await getAllBlocks();
			await selectBlockByClientId( allBlocks[ 0 ].clientId );

			await toggleSidebar();

			expect( await getActiveTabLabel() ).toEqual( 'Block (selected)' );
		} );
	} );

	describe( 'Tab switch based on selection', () => {
		it( 'should switch to block tab if we select a block, when Template is selected', async () => {
			await toggleSidebar();
			expect( await getActiveTabLabel() ).toEqual(
				'Template (selected)'
			);
			// By inserting the block is also selected.
			await insertBlock( 'Heading' );
			expect( await getActiveTabLabel() ).toEqual( 'Block (selected)' );
		} );
		it( 'should switch to Template tab when a block was selected and we select the Template', async () => {
			await insertBlock( 'Heading' );
			await toggleSidebar();
			expect( await getActiveTabLabel() ).toEqual( 'Block (selected)' );
			await page.evaluate( () => {
				wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
			} );
			expect( await getActiveTabLabel() ).toEqual(
				'Template (selected)'
			);
		} );
	} );
} );
