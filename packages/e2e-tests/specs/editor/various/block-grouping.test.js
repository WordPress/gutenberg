/**
 * WordPress dependencies
 */
import {
	insertBlock,
	createNewPost,
	clickBlockToolbarButton,
	clickMenuItem,
	pressKeyWithModifier,
	getEditedPostContent,
	transformBlockTo,
	getAllBlocks,
	getAvailableBlockTransforms,
	activatePlugin,
	deactivatePlugin,
	createReusableBlock,
} from '@wordpress/e2e-test-utils';

async function insertBlocksOfSameType() {
	await insertBlock( 'Paragraph' );
	await page.keyboard.type( 'First Paragraph' );

	await insertBlock( 'Paragraph' );
	await page.keyboard.type( 'Second Paragraph' );

	await insertBlock( 'Paragraph' );
	await page.keyboard.type( 'Third Paragraph' );
}

async function insertBlocksOfMultipleTypes() {
	await insertBlock( 'Heading' );
	await page.keyboard.type( 'Group Heading' );

	await insertBlock( 'Image' );

	await insertBlock( 'Paragraph' );
	await page.keyboard.type( 'Some paragraph' );
}

describe( 'Block Grouping', () => {
	beforeEach( async () => {
		// Posts are auto-removed at the end of each test run
		await createNewPost();
	} );

	describe( 'Group creation', () => {
		it( 'creates a group from multiple blocks of the same type via block transforms', async () => {
			// Creating test blocks
			await insertBlocksOfSameType();

			// Multiselect via keyboard.
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );

			await transformBlockTo( 'Group' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'creates a group from multiple blocks of different types via block transforms', async () => {
			// Creating test blocks
			await insertBlocksOfMultipleTypes();

			// Multiselect via keyboard.
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );

			await transformBlockTo( 'Group' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'creates a group from multiple blocks of the same type via options toolbar', async () => {
			// Creating test blocks
			await insertBlocksOfSameType();

			// Multiselect via keyboard.
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );

			await clickBlockToolbarButton( 'Options' );
			await clickMenuItem( 'Group' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'groups and ungroups multiple blocks of different types via options toolbar', async () => {
			// Creating test blocks
			await insertBlocksOfMultipleTypes();
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );

			// Group
			await clickBlockToolbarButton( 'Options' );
			await clickMenuItem( 'Group' );

			expect( await getEditedPostContent() ).toMatchSnapshot();

			// UnGroup
			await clickBlockToolbarButton( 'Options' );
			await clickMenuItem( 'Ungroup' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'does not allow ungrouping a group block that has no children', async () => {
			await insertBlock( 'Group' );
			await clickBlockToolbarButton( 'Options' );
			const ungroupButtons = await page.$x(
				'//button/span[text()="Ungroup"]'
			);
			expect( ungroupButtons ).toHaveLength( 0 );
		} );
		it( 'should group and ungroup a controlled block properly', async () => {
			const getParagraphText = async () => {
				const paragraphInReusableSelector =
					'.block-editor-block-list__block[data-type="core/block"] p';
				await page.waitForSelector( paragraphInReusableSelector );
				return page.$eval(
					paragraphInReusableSelector,
					( element ) => element.innerText
				);
			};

			const paragraphText = 'hi';
			await createReusableBlock( paragraphText, 'Block' );
			// Group
			await clickBlockToolbarButton( 'Options' );
			await clickMenuItem( 'Group' );

			let group = await page.$$( '[data-type="core/group"]' );
			expect( group ).toHaveLength( 1 );
			// Make sure the paragraph in reusable block exists.
			expect( await getParagraphText() ).toMatch( paragraphText );

			await clickBlockToolbarButton( 'Options' );
			await clickMenuItem( 'Ungroup' );
			group = await page.$$( '[data-type="core/group"]' );
			expect( group ).toHaveLength( 0 );
			// Make sure the paragraph in reusable block exists.
			expect( await getParagraphText() ).toEqual( paragraphText );
		} );
		it( 'should group another Group block via options toolbar', async () => {
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( '1' );
			await clickBlockToolbarButton( 'Options' );
			await clickMenuItem( 'Group' );
			await clickBlockToolbarButton( 'Options' );
			await clickMenuItem( 'Group' );
			expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
			"<!-- wp:group -->
			<div class=\\"wp-block-group\\"><!-- wp:group -->
			<div class=\\"wp-block-group\\"><!-- wp:paragraph -->
			<p>1</p>
			<!-- /wp:paragraph --></div>
			<!-- /wp:group --></div>
			<!-- /wp:group -->"
		` );
		} );
	} );

	describe( 'Grouping Block availability', () => {
		beforeEach( async () => {
			// Disable the Group block
			await page.evaluate( () => {
				const { dispatch } = wp.data;
				dispatch( 'core/edit-post' ).hideBlockTypes( [ 'core/group' ] );
			} );

			// Create a Group
			await insertBlocksOfMultipleTypes();
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );
		} );

		afterAll( async () => {
			// Re-enable the Group block
			await page.evaluate( () => {
				const { dispatch } = wp.data;
				dispatch( 'core/edit-post' ).showBlockTypes( [ 'core/group' ] );
			} );
		} );

		it( 'does not show group transform if Grouping block is disabled', async () => {
			const availableTransforms = await getAvailableBlockTransforms();

			expect( availableTransforms ).not.toContain( 'Group' );
		} );

		it( 'does not show group option in the options toolbar if Grouping block is disabled', async () => {
			await clickBlockToolbarButton( 'Options' );

			const blockOptionsDropdownHTML = await page.evaluate(
				() =>
					document.querySelector(
						'.block-editor-block-settings-menu__popover'
					).innerHTML
			);

			expect( blockOptionsDropdownHTML ).not.toContain( 'Group' );
		} );
	} );

	describe( 'Preserving selected blocks attributes', () => {
		it( 'preserves width alignment settings of selected blocks', async () => {
			await insertBlock( 'Heading' );
			await page.keyboard.type( 'Group Heading' );

			// Full width image.
			await insertBlock( 'Image' );
			await clickBlockToolbarButton( 'Align' );
			const fullButton = await page.waitForXPath(
				`//button[contains(@class,'components-dropdown-menu__menu-item')]//span[contains(text(), 'Full width')]`
			);
			await fullButton.evaluate( ( element ) =>
				element.scrollIntoView()
			);
			await fullButton.click();

			// Wide width image.
			await insertBlock( 'Image' );
			await clickBlockToolbarButton( 'Align' );
			const wideButton = await page.waitForXPath(
				`//button[contains(@class,'components-dropdown-menu__menu-item')]//span[contains(text(), 'Wide width')]`
			);
			await wideButton.evaluate( ( element ) =>
				element.scrollIntoView()
			);
			await wideButton.click();

			await insertBlock( 'Paragraph' );
			await page.keyboard.type( 'Some paragraph' );

			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );

			await transformBlockTo( 'Group' );

			const allBlocks = await getAllBlocks();

			// We expect Group block align setting to match that
			// of the widest of it's "child" innerBlocks
			expect( allBlocks[ 0 ].attributes.align ).toBe( 'full' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'Registering alternative Blocks to handle Grouping interactions', () => {
		beforeAll( async () => {
			await activatePlugin( 'gutenberg-test-custom-grouping-block' );
		} );

		afterAll( async () => {
			await deactivatePlugin( 'gutenberg-test-custom-grouping-block' );
		} );

		it( 'should use registered grouping block for grouping interactions', async () => {
			// Set custom Block as the Block to use for Grouping
			await page.evaluate( () => {
				window.wp.blocks.setGroupingBlockName(
					'test/alternative-group-block'
				);
			} );

			// Creating test blocks
			await insertBlocksOfSameType();

			// Multiselect via keyboard.
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );

			// Group - this will use whichever Block is registered as the Grouping Block
			// as opposed to "transformTo()" which uses whatever is passed to it. To
			// ensure this test is meaningful we must rely on what is registered.
			await clickBlockToolbarButton( 'Options' );
			await clickMenuItem( 'Group' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );
} );
