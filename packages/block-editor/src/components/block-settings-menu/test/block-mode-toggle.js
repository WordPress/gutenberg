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

	it( 'should render the HTML mode button', () => {
		const wrapper = getShallowRenderOutput(
			<BlockModeToggle
				mode="visual"
			/>
		);
		const text = wrapper.props.children;

		expect( text ).toEqual( 'Edit as HTML' );
	} );

	it( 'should render the Visual mode button', () => {
		const wrapper = getShallowRenderOutput(
			<BlockModeToggle
				mode="html"
			/>
		);
		const text = wrapper.props.children;

		expect( text ).toEqual( 'Edit visually' );
	} );
} );
