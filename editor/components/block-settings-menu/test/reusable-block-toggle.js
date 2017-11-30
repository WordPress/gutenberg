/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { ReusableBlockToggle } from '../reusable-block-toggle';

describe( 'ReusableBlockToggle', () => {
	it( 'should allow converting a reusable block to static', () => {
		const wrapper = shallow(
			<ReusableBlockToggle
				block={ { name: 'core/reusable-block' } }
			/>
		);
		const text = wrapper.find( 'IconButton' ).first().prop( 'children' );

		expect( text ).toEqual( 'Detach from Reusable Block' );
	} );

	it( 'should allow converting a static block to reusable', () => {
		const wrapper = shallow(
			<ReusableBlockToggle
				block={ { name: 'core/paragraph' } }
			/>
		);
		const text = wrapper.find( 'IconButton' ).first().prop( 'children' );

		expect( text ).toEqual( 'Convert to Reusable Block' );
	} );
} );
