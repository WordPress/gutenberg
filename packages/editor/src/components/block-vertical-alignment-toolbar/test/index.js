/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { BlockVerticalAlignmentToolbar } from '../';

describe( 'BlockVerticalAlignmentToolbar', () => {
	const alignment = 'top';
	const onChange = jest.fn();

	const wrapper = shallow( <BlockVerticalAlignmentToolbar value={ alignment } onChange={ onChange } /> );

	const controls = wrapper.props().controls;

	afterEach( () => {
		onChange.mockClear();
	} );

	test( 'should match snapshot', () => {
		expect( wrapper ).toMatchSnapshot();
	} );

	test( 'should call onChange with undefined, when the control is already active', () => {
		const activeControl = controls.find( ( { _id } ) => _id === alignment );
		activeControl.onClick();

		expect( activeControl.isActive ).toBe( true );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( undefined );
	} );

	test( 'should call onChange with alignment value when the control is inactive', () => {
		const inactiveCenterControl = controls.find( ( { _id } ) => _id === 'center' );

		inactiveCenterControl.onClick();

		expect( inactiveCenterControl.isActive ).toBe( false );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( 'center' );
	} );
} );
