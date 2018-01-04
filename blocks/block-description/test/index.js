/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import BlockDescription from '../';

describe( 'BlockDescription', () => {
	describe( 'basic rendering', () => {
		it( 'should render a <p> element with some content', () => {
			const blockDescription = shallow( <BlockDescription><p>Hello World</p></BlockDescription> );
			expect( blockDescription.hasClass( 'components-block-description' ) ).toBe( true );
			expect( blockDescription.type() ).toBe( 'div' );
			expect( blockDescription.text() ).toBe( 'Hello World' );
			expect( console ).toHaveWarnedWith(
				'The wp.blocks.BlockDescription component is deprecated. Use the "description" block property instead.'
			);
		} );
	} );
} );
