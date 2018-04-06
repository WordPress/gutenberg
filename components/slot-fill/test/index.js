/**
 * External dependecies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { createSlotFill, Fill, Slot } from '../';

describe( 'createSlotFill', () => {
	const SLOT_NAME = 'MyFill';
	const MyFill = createSlotFill( SLOT_NAME );

	test( 'should match snapshot for Fill', () => {
		const wrapper = shallow( <MyFill /> );

		expect( wrapper.type() ).toBe( Fill );
		expect( wrapper ).toHaveProp( 'name', SLOT_NAME );
	} );

	test( 'should match snapshot for Slot', () => {
		const wrapper = shallow( <MyFill.Slot /> );

		expect( wrapper.type() ).toBe( Slot );
		expect( wrapper ).toHaveProp( 'name', SLOT_NAME );
	} );
} );
