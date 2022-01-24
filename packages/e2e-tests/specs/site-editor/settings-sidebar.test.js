/**
 * WordPress dependencies
 */
import {
	trashAllPosts,
	activateTheme,
	getAllBlocks,
	selectBlockByClientId,
	insertBlock,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { siteEditor } from './utils';

async function toggleSidebar() {
	await page.click(
		'.edit-site-header__actions button[aria-label="Settings"]'
	);
}

async function getActiveTabLabel() {
	return await page.$eval(
		'.edit-site-sidebar__panel-tab.is-active',
		( element ) => element.getAttribute( 'aria-label' )
	);
}

async function getTemplateCard() {
	return {
		title: await page.$eval(
			'.edit-site-template-card__title',
			( element ) => element.innerText
		),
		description: await page.$eval(
			'.edit-site-template-card__description',
			( element ) => element.innerText
		),
	};
}

describe( 'Settings sidebar', () => {
	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
	} );
	afterAll( async () => {
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
		await activateTheme( 'twentytwentyone' );
	} );
	beforeEach( async () => {
		await siteEditor.visit();
		await siteEditor.disableWelcomeGuide();
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
			await siteEditor.visit( {
				postId: 'emptytheme//singular',
				postType: 'wp_template',
			} );
			const templateCardAfterNavigation = await getTemplateCard();

			expect( templateCardBeforeNavigation ).toMatchObject( {
				title: 'Index',
				description: 'Displays posts.',
			} );
			expect( templateCardAfterNavigation ).toMatchObject( {
				title: 'Singular',
				description: 'Displays a single post or page.',
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
