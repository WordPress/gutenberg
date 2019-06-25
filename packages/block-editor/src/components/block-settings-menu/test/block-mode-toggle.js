/**
 * External dependencies
 */
import ShallowRenderer from 'react-test-renderer/shallow';

/**
 * Internal dependencies
 */
import { BlockModeToggle } from '../block-mode-toggle';

describe( 'BlockModeToggle', () => {
	function getShallowRenderOutput( element ) {
		const renderer = new ShallowRenderer();
		renderer.render( element );
		return renderer.getRenderOutput();
	}

	it( "should not render the HTML mode button if the block doesn't support it", () => {
		const wrapper = getShallowRenderOutput(
			<BlockModeToggle blockType={ { supports: { html: false } } } />
		);

		expect( wrapper ).toBe( null );
	} );

	it( 'should render the HTML mode button', () => {
		const wrapper = getShallowRenderOutput(
			<BlockModeToggle
				blockType={ { supports: { html: true } } }
				mode="visual"
			/>
		);
		const text = wrapper.props.children;

		expect( text ).toEqual( 'Edit as HTML' );
	} );

	it( 'should render the Visual mode button', () => {
		const wrapper = getShallowRenderOutput(
			<BlockModeToggle
				blockType={ { supports: { html: true } } }
				mode="html"
			/>
		);
		const text = wrapper.props.children;

		expect( text ).toEqual( 'Edit visually' );
	} );

	it( 'should not render the Visual mode button if code editing is disabled', () => {
		const wrapper = getShallowRenderOutput(
			<BlockModeToggle
				blockType={ { supports: { html: true } } }
				mode="html"
				isCodeEditingEnabled={ false }
			/>
		);

		expect( wrapper ).toBe( null );
	} );
} );
