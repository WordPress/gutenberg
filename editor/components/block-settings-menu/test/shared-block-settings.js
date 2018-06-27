/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { SharedBlockSettings } from '../shared-block-settings';

describe( 'SharedBlockSettings', () => {
	it( 'should allow converting a static block to a shared block', () => {
		const onConvert = jest.fn();
		const wrapper = shallow(
			<SharedBlockSettings
				sharedBlock={ null }
				onConvertToShared={ onConvert }
			/>
		);

		const text = wrapper.find( 'IconButton' ).children().text();
		expect( text ).toEqual( 'Convert to Shared Block' );

		wrapper.find( 'IconButton' ).simulate( 'click' );
		expect( onConvert ).toHaveBeenCalled();
	} );

	it( 'should allow converting a shared block to static', () => {
		const onConvert = jest.fn();
		const wrapper = shallow(
			<SharedBlockSettings
				sharedBlock={ {} }
				onConvertToStatic={ onConvert }
			/>
		);

		const text = wrapper.find( 'IconButton' ).first().children().text();
		expect( text ).toEqual( 'Convert to Regular Block' );

		wrapper.find( 'IconButton' ).first().simulate( 'click' );
		expect( onConvert ).toHaveBeenCalled();
	} );
} );
