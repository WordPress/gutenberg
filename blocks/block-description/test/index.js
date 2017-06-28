/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import BlockDescription from '../';

describe( 'BlockDescription', () => {
	describe( 'basic rendering', () => {
		it( 'should render a <p> element with some content', () => {
			const blockDescription = shallow( <BlockDescription><p>Hello World</p></BlockDescription> );
			expect( blockDescription.hasClass( 'components-block-description' ) ).to.be.true();
			expect( blockDescription.type() ).to.equal( 'div' );
			expect( blockDescription.text() ).to.equal( 'Hello World' );
		} );
	} );
} );
