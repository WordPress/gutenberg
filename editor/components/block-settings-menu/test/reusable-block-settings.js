/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { ReusableBlockSettings } from '../reusable-block-settings';

describe( 'ReusableBlockSettings', () => {
	it( 'should allow converting a static block to reusable', () => {
		const onConvert = jest.fn();
		const wrapper = shallow(
			<ReusableBlockSettings
				reusableBlock={ null }
				onConvertToReusable={ onConvert }
			/>
		);

		const text = wrapper.find( 'IconButton' ).children().text();
		expect( text ).toEqual( 'Convert to Reusable Block' );

		wrapper.find( 'IconButton' ).simulate( 'click' );
		expect( onConvert ).toHaveBeenCalled();
	} );

	it( 'should allow converting a reusable block to static', () => {
		const onConvert = jest.fn();
		const wrapper = shallow(
			<ReusableBlockSettings
				reusableBlock={ {} }
				onConvertToStatic={ onConvert }
			/>
		);

		const text = wrapper.find( 'IconButton' ).first().children().text();
		expect( text ).toEqual( 'Detach from Reusable Block' );

		wrapper.find( 'IconButton' ).first().simulate( 'click' );
		expect( onConvert ).toHaveBeenCalled();
	} );

	it( 'should allow deleting a reusable block', () => {
		const onDelete = jest.fn();
		const wrapper = shallow(
			<ReusableBlockSettings
				reusableBlock={ { id: 123 } }
				onDelete={ onDelete }
			/>
		);

		const text = wrapper.find( 'IconButton' ).last().children().text();
		expect( text ).toEqual( 'Delete Reusable Block' );

		wrapper.find( 'IconButton' ).last().simulate( 'click' );
		expect( onDelete ).toHaveBeenCalledWith( 123 );
	} );
} );
