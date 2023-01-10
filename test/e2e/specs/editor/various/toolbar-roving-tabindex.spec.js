/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	ToolbarRovingTabindexUtils: async ( { page, pageUtils }, use ) => {
		await use( new ToolbarRovingTabindexUtils( { page, pageUtils } ) );
	},
} );

test.describe( 'Toolbar roving tabindex', () => {
	test.beforeEach( async ( { admin, editor, page } ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'First block' );
	} );

	test( 'ensures paragraph block toolbar uses roving tabindex', async ( {
		editor,
		page,
		ToolbarRovingTabindexUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Paragraph' );
		await ToolbarRovingTabindexUtils.testBlockToolbarKeyboardNavigation(
			'Paragraph block',
			'Paragraph'
		);
		await ToolbarRovingTabindexUtils.wrapCurrentBlockWithGroup(
			'Paragraph'
		);
		await ToolbarRovingTabindexUtils.testGroupKeyboardNavigation(
			'Paragraph block',
			'Paragraph'
		);
	} );

	test( 'ensures heading block toolbar uses roving tabindex', async ( {
		editor,
		page,
		ToolbarRovingTabindexUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/heading' } );
		await page.keyboard.type( 'Heading' );
		await ToolbarRovingTabindexUtils.testBlockToolbarKeyboardNavigation(
			'Block: Heading',
			'Heading'
		);
		await ToolbarRovingTabindexUtils.wrapCurrentBlockWithGroup( 'Heading' );
		await ToolbarRovingTabindexUtils.testGroupKeyboardNavigation(
			'Block: Heading',
			'Heading'
		);
	} );

	test( 'ensures list block toolbar uses roving tabindex', async ( {
		editor,
		page,
		ToolbarRovingTabindexUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'List' );
		await ToolbarRovingTabindexUtils.testBlockToolbarKeyboardNavigation(
			'List text',
			'Select List'
		);
		await page.click( `role=button[name="Select List"i]` );
		await ToolbarRovingTabindexUtils.wrapCurrentBlockWithGroup( 'List' );
		await ToolbarRovingTabindexUtils.testGroupKeyboardNavigation(
			'Block: List',
			'List'
		);
	} );

	test( 'ensures image block toolbar uses roving tabindex', async ( {
		editor,
		ToolbarRovingTabindexUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );
		await ToolbarRovingTabindexUtils.testBlockToolbarKeyboardNavigation(
			'Block: Image',
			'Image'
		);
		await ToolbarRovingTabindexUtils.wrapCurrentBlockWithGroup( 'Image' );
		await ToolbarRovingTabindexUtils.testGroupKeyboardNavigation(
			'Block: Image',
			'Image'
		);
	} );

	test( 'ensures table block toolbar uses roving tabindex', async ( {
		editor,
		page,
		ToolbarRovingTabindexUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/table' } );
		await ToolbarRovingTabindexUtils.testBlockToolbarKeyboardNavigation(
			'Block: Table',
			'Table'
		);
		// Move focus to the first toolbar item.
		await page.keyboard.press( 'Home' );
		await ToolbarRovingTabindexUtils.expectLabelToHaveFocus( 'Table' );
		await page.click( `role=button[name="Create Table"i]` );
		await page.keyboard.press( 'Tab' );
		await ToolbarRovingTabindexUtils.testBlockToolbarKeyboardNavigation(
			'Body cell text',
			'Table'
		);
		await ToolbarRovingTabindexUtils.wrapCurrentBlockWithGroup( 'Table' );
		await ToolbarRovingTabindexUtils.testGroupKeyboardNavigation(
			'Block: Table',
			'Table'
		);
	} );

	test( 'ensures custom html block toolbar uses roving tabindex', async ( {
		editor,
		ToolbarRovingTabindexUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/html' } );
		await ToolbarRovingTabindexUtils.testBlockToolbarKeyboardNavigation(
			'HTML',
			'Custom HTML'
		);
		await ToolbarRovingTabindexUtils.wrapCurrentBlockWithGroup(
			'Custom HTML'
		);
		await ToolbarRovingTabindexUtils.testGroupKeyboardNavigation(
			'Block: Custom HTML',
			'Custom HTML'
		);
	} );

	test( 'ensures block toolbar remembers the last focused item', async ( {
		editor,
		page,
		pageUtils,
		ToolbarRovingTabindexUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Paragraph' );
		await ToolbarRovingTabindexUtils.focusBlockToolbar();
		await page.keyboard.press( 'ArrowRight' );
		await ToolbarRovingTabindexUtils.expectLabelToHaveFocus( 'Move up' );
		await page.keyboard.press( 'Tab' );
		await pageUtils.pressKeyWithModifier( 'shift', 'Tab' );
		await ToolbarRovingTabindexUtils.expectLabelToHaveFocus( 'Move up' );
	} );

	test( 'can reach toolbar items with arrow keys after pressing alt+F10', async ( {
		page,
		pageUtils,
		ToolbarRovingTabindexUtils,
	} ) => {
		await pageUtils.pressKeyWithModifier( 'alt', 'F10' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		await ToolbarRovingTabindexUtils.expectLabelToHaveFocus( 'Bold' );
	} );
} );

class ToolbarRovingTabindexUtils {
	constructor( { page, pageUtils } ) {
		this.page = page;
		this.pageUtils = pageUtils;
	}

	async focusBlockToolbar() {
		await this.pageUtils.pressKeyWithModifier( 'alt', 'F10' );
	}

	async testBlockToolbarKeyboardNavigation(
		currentBlockLabel,
		currentBlockTitle
	) {
		await this.focusBlockToolbar();
		await this.expectLabelToHaveFocus( currentBlockTitle );
		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( 'Move up' );
		await this.page.keyboard.press( 'Tab' );
		await this.expectLabelToHaveFocus( currentBlockLabel );
		await this.pageUtils.pressKeyWithModifier( 'shift', 'Tab' );
		await this.expectLabelToHaveFocus( 'Move up' );
	}

	async expectLabelToHaveFocus( label ) {
		let ariaLabel = await this.page.evaluate( () =>
			document.activeElement.getAttribute( 'aria-label' )
		);
		// If the labels don't match, try pressing Up Arrow to focus the block wrapper in non-content editable block.
		if ( ariaLabel !== label ) {
			await this.page.keyboard.press( 'ArrowUp' );
			ariaLabel = await this.page.evaluate( () =>
				document.activeElement.getAttribute( 'aria-label' )
			);
		}
		await expect( ariaLabel ).toBe( label );
	}

	async wrapCurrentBlockWithGroup( currentBlockTitle ) {
		await this.page.click( `role=button[name="${ currentBlockTitle }"i]` );
		await this.page.click( `role=menuitem[name="Group"]` );
	}

	async testGroupKeyboardNavigation( currentBlockLabel, currentBlockTitle ) {
		await this.expectLabelToHaveFocus( 'Block: Group' );
		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( currentBlockLabel );
		await this.pageUtils.pressKeyWithModifier( 'shift', 'Tab' );
		await this.expectLabelToHaveFocus( 'Select Group' );
		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( currentBlockTitle );
	}
}
