/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'splitting and merging blocks', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'should split and merge paragraph blocks using Enter and Backspace', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Use regular inserter to add paragraph block and text.
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'FirstSecond' );

		// Move caret between 'First' and 'Second' and press Enter to split
		// paragraph blocks.
		await pageUtils.pressKeyTimes( 'ArrowLeft', 6 );
		await page.keyboard.press( 'Enter' );

		// Assert that there are now two paragraph blocks with correct content.
		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>First</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Second</p>
<!-- /wp:paragraph -->`
		);

		// Press Backspace to merge paragraph blocks.
		await page.keyboard.press( 'Backspace' );

		// Ensure that caret position is correctly placed at the between point.
		await page.keyboard.type( 'Between' );
		// Check the content.
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>First</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Second</p>
<!-- /wp:paragraph -->`
		);

		await pageUtils.pressKeyTimes( 'Backspace', 7 ); // Delete "Between"

		// Edge case: Without ensuring that the editor still has focus when
		// restoring a bookmark, the caret may be inadvertently moved back to
		// an inline boundary after a split occurs.
		await page.keyboard.press( 'Home' );
		await page.keyboard.down( 'Shift' );
		await pageUtils.pressKeyTimes( 'ArrowRight', 5 );
		await page.keyboard.up( 'Shift' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		// Collapse selection, still within inline boundary.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'BeforeSecond:' );

		// Check the content.
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>First</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Second</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should merge into inline boundary position', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Regression Test: Caret should reset to end of inline boundary when
		// backspacing to delete second paragraph.
		await editor.insertBlock( { name: 'core/paragraph' } );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( 'Foo' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Backspace' );

		// Replace contents of first paragraph with "Bar".
		await pageUtils.pressKeyTimes( 'Backspace', 4 );
		await page.keyboard.type( 'Bar' );

		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>Bar</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should delete an empty first line', async ( { editor, page } ) => {
		// Regression Test: When a paragraph block has line break, and the first
		// line has no text, pressing backspace at the start of the second line
		// should remove the first.
		//
		// See: https://github.com/WordPress/gutenberg/issues/8388

		// First paragraph.
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'First' );
		await page.keyboard.press( 'Enter' );

		// Second paragraph.
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.up( 'Shift' );

		// Delete the soft line break.
		await page.keyboard.press( 'Backspace' );

		// Typing at this point should occur still within the second paragraph,
		// while before the regression fix it would have occurred in the first.
		await page.keyboard.type( 'Still Second' );

		// Check the content.

		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>First</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Still Second</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should not merge paragraphs if the selection is not collapsed', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Regression Test: When all of a paragraph is selected, pressing
		// backspace should delete the contents, not merge to previous.
		//
		// See: https://github.com/WordPress/gutenberg/issues/8268
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Foo' );
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Bar' );

		// Select text.
		await page.keyboard.down( 'Shift' );
		await pageUtils.pressKeyTimes( 'ArrowLeft', 3 );
		await page.keyboard.up( 'Shift' );

		// Delete selection.
		await page.keyboard.press( 'Backspace' );
		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>Foo</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should gracefully handle if placing caret in empty container', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Regression Test: placeCaretAtHorizontalEdge previously did not
		// account for contentEditables which have no children.
		//
		// See: https://github.com/WordPress/gutenberg/issues/8676
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Foo' );

		// The regression appeared to only affect paragraphs created while
		// within an inline boundary.
		await page.keyboard.down( 'Shift' );
		await pageUtils.pressKeyTimes( 'ArrowLeft', 3 );
		await page.keyboard.up( 'Shift' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		await page.keyboard.press( 'Backspace' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p><strong>Foo</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should forward delete from an empty paragraph', async ( {
		editor,
		page,
	} ) => {
		// Regression test: Bogus nodes in a RichText container can interfere
		// with isHorizontalEdge detection, preventing forward deletion.
		//
		// See: https://github.com/WordPress/gutenberg/issues/8731
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Delete' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>Second</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should remove empty paragraph block on backspace', async ( {
		editor,
		page,
	} ) => {
		// Regression Test: In a sole empty paragraph, pressing backspace
		// should remove the block.
		//
		// See: https://github.com/WordPress/gutenberg/pull/8306
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.press( 'Backspace' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe( `` );
	} );

	test( 'should remove at most one paragraph in forward direction', async ( {
		editor,
		page,
	} ) => {
		// Regression Test: A forward delete on empty RichText previously would
		// destroy two paragraphs on the dual-action of merge & remove.
		//
		// See: https://github.com/WordPress/gutenberg/pull/8735
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'First' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Delete' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>First</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Second</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should ensure always a default block', async ( {
		editor,
		page,
	} ) => {
		// Feature: To avoid focus loss, removal of all blocks will result in a
		// default block insertion at the root. Pressing backspace in a new
		// paragraph should not effectively allow removal. This is counteracted
		// with pre-save content processing to save post consisting of only the
		// unmodified default block as an empty string.
		//
		// See: https://github.com/WordPress/gutenberg/issues/9626
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.press( 'Backspace' );

		// There is a default block and post title:
		await expect(
			page.locator( 'role=document[name=/Empty block/i]' )
		).toBeVisible();

		await expect(
			page.locator( 'role=textbox[name="Add title"i]' )
		).toBeVisible();

		// But the effective saved content is still empty:
		expect( await editor.getEditedPostContent() ).toBe( '' );

		// And focus is retained:
		await expect(
			page.locator( 'role=document[name=/Empty block/i]' )
		).toBeFocused();
	} );

	test( 'should undo split in one go', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '12' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'z' );

		// Check the content.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should not split with line break in front', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Backspace' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>2</p>
<!-- /wp:paragraph -->`
		);
	} );

	test.describe(
		'test restore selection when merge produces more than one block',
		() => {
			test( 'on forward delete', async ( {
				editor,
				page,
				pageUtils,
			} ) => {
				await editor.insertBlock( { name: 'core/paragraph' } );
				await page.keyboard.type( 'hi' );
				await editor.insertBlock( { name: 'core/list' } );
				await page.keyboard.type( 'item 1' );
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( 'item 2' );
				await pageUtils.pressKeyTimes( 'ArrowUp', 3 );
				await page.keyboard.press( 'Delete' );

				expect( await editor.getEditedPostContent() ).toMatchSnapshot();

				await page.keyboard.press( 'Delete' );
				// Carret should be in the first block and at the proper position.
				await page.keyboard.type( '-' );

				// Check the content.
				expect( await editor.getEditedPostContent() ).toMatchSnapshot();
			} );

			test( 'on backspace', async ( { editor, page, pageUtils } ) => {
				await editor.insertBlock( { name: 'core/paragraph' } );
				await page.keyboard.type( 'hi' );
				await editor.insertBlock( { name: 'core/list' } );
				await page.keyboard.type( 'item 1' );
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( 'item 2' );
				await page.keyboard.press( 'ArrowUp' );
				await pageUtils.pressKeyTimes( 'ArrowLeft', 6 );
				await page.keyboard.press( 'Backspace' );

				expect( await editor.getEditedPostContent() ).toMatchSnapshot();

				await page.keyboard.press( 'Backspace' );
				// Carret should be in the first block and at the proper position.
				await page.keyboard.type( '-' );

				// Check the content.
				expect( await editor.getEditedPostContent() ).toMatchSnapshot();
			} );
		}
	);
} );
