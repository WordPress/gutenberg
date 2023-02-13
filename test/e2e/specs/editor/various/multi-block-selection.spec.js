/**
 * WordPress dependencies
 */
const { test } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Multi-block selection', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should select with double ctrl+a and speak', async ( {} ) => {} );
	test( 'should only trigger multi-selection when at the end', async ( {} ) => {} );
	test( 'should use selection direction to determine vertical edge', async ( {} ) => {} );
	test( 'should always expand single line selection', async ( {} ) => {} );
	test( 'should allow selecting outer edge if there is no sibling block', async ( {} ) => {} );
	test( 'should select and deselect with shift and arrow keys', async ( {} ) => {} );
	test( 'should deselect with Escape', async ( {} ) => {} );
	test( 'should select with shift + click', async ( {} ) => {} );
	test( 'should properly select a single block even if `shift` was held for the selection', async ( {} ) => {} );
	test( 'should properly select multiple blocks if selected nested blocks belong to different parent', async ( {} ) => {} );
	test( 'should properly select part of nested rich text block while holding shift', async ( {} ) => {} );
	test( 'should select by dragging', async ( {} ) => {} );
	test( 'should select by dragging into nested block', async ( {} ) => {} );
	test( 'should cut and paste', async ( {} ) => {} );
	test( 'should copy and paste', async ( {} ) => {} );
	test( 'should return original focus after failed multi selection attempt', async ( {} ) => {} );
	test( 'should preserve dragged selection on move', async ( {} ) => {} );
	test( 'should clear selection when clicking next to blocks', async ( {} ) => {} );
	test( 'should place the caret at the end of last pasted paragraph (paste to empty )', async ( {} ) => {} );
	test( 'should place the caret at the end of last pasted paragraph (paste mid-block)', async ( {} ) => {} );
	test( 'should place the caret at the end of last pasted paragraph (replace)', async ( {} ) => {} );
	test( 'should set attributes for multiple paragraphs', async ( {} ) => {} );
	test( 'should copy multiple blocks', async ( {} ) => {} );
	test( 'should not multi select single block', async ( {} ) => {} );
	test( 'should gradually multi-select', async ( {} ) => {} );
	test( 'should multi-select from within the list block', async ( {} ) => {} );
	test( 'should select all from empty selection', async ( {} ) => {} );
	test( 'should select title if the cursor is on title', async ( {} ) => {} );
	test( 'should multi-select in the ListView component with shift + click', async ( {} ) => {} );
	test( 'should multi-select in the ListView component with shift + up and down keys', async ( {} ) => {} );
	test( 'should forward delete across blocks', async ( {} ) => {} );
	test( 'should write over selection', async ( {} ) => {} );
	test( 'should handle Enter across blocks', async ( {} ) => {} );
	test( 'should select separator (single element block)', async ( {} ) => {} );
	test( 'should partially select with shift + click', async ( {} ) => {} );
	test.describe( 'shift+click multi-selection', () => {
		test( 'should multi-select block with text selection and a block without text selection', async ( {} ) => {} );
		test( 'should multi-select blocks without text selection', async ( {} ) => {} );
	} );
	test( 'should select by dragging into separator', async ( {} ) => {} );
} );
