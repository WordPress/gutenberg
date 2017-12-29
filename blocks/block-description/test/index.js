/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import BlockDescription from '../';

/* eslint-disable no-console */
function expectWarning() {
	expect( console.warn ).toHaveBeenCalled();
	console.warn.mockClear();
}
/* eslint-enable no-console */

describe( 'BlockDescription', () => {
	describe( 'basic rendering', () => {
		it( 'should render a <p> element with some content', () => {
			const blockDescription = shallow( <BlockDescription><p>Hello World</p></BlockDescription> );
			expect( blockDescription.hasClass( 'components-block-description' ) ).toBe( true );
			expect( blockDescription.type() ).toBe( 'div' );
			expect( blockDescription.text() ).toBe( 'Hello World' );
			expectWarning();
		} );
	} );
} );
