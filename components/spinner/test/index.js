/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Spinner from '../';

describe( 'Spinner', () => {
	describe( 'basic rendering', () => {
		it( 'should match the following element', () => {
			const element = <span className="spinner is-active" />;
			const spinner = shallow( <Spinner /> );
			expect( spinner.matchesElement( element ) ).to.be.true();
		} );
	} );
} );
