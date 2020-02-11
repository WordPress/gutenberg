/**
 * Internal dependencies
 */
import { hasInnerBlocksContext } from '../dom';

describe( 'hasInnerBlocksContext()', () => {
	it( 'should return false for a block node which has no inner blocks', () => {
		const wrapper = document.createElement( 'div' );
		wrapper.innerHTML =
			'<div class="block-editor-block-list__block" data-type="core/paragraph" tabindex="0">' +
			'	<div class="block-editor-block-list__block-edit" aria-label="Block: Paragraph">' +
			'		<p contenteditable="true">This is a test.</p>' +
			'	</div>' +
			'</div>';

		const blockNode = wrapper.firstChild;
		expect( hasInnerBlocksContext( blockNode ) ).toBe( false );
	} );

	it( 'should return true for a block node which contains inner blocks', () => {
		const wrapper = document.createElement( 'div' );
		wrapper.innerHTML =
			'<div class="block-editor-block-list__block" data-type="core/columns" tabindex="0">' +
			'	<div class="block-editor-block-list__block-edit" aria-label="Block: Columns (beta)">' +
			'		<div class="wp-block-columns has-2-columns">' +
			'			<div class="block-editor-block-list__layout"></div>' +
			'			<div class="block-editor-block-list__layout"></div>' +
			'		</div>' +
			'	</div>' +
			'</div>';

		const blockNode = wrapper.firstChild;
		expect( hasInnerBlocksContext( blockNode ) ).toBe( true );
	} );
} );
