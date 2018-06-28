/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { SharedBlockConvertButton } from '../shared-block-convert-button';

describe( 'SharedBlockConvertButton', () => {
	it( 'should allow converting a static block to a shared block', () => {
		const onConvert = jest.fn();
		const wrapper = shallow(
			<SharedBlockConvertButton
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
			<SharedBlockConvertButton
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
