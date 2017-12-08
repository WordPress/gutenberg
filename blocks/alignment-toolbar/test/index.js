/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import AlignmentToolbar from '../';

describe( 'AlignmentToolbar', () => {
	const value = 'left';
	const onChange = jest.fn();

	const wrapper = shallow( <AlignmentToolbar value={ value } onChange={ onChange } /> );

	const controls = wrapper.props().controls;

	beforeEach( () => {
		onChange.mockClear();
	} );

	test( 'should render the component.', () => {
		expect( wrapper ).toMatchSnapshot();
	} );

	test( 'should call on change with null when a control is already active.', () => {
		// Check onClick handler for an active control.
		controls.find( ( control ) => control.isActive ).onClick();

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		// Should be called null when active control is clicked.
		expect( onChange ).toHaveBeenCalledWith( null );
	} );

	test( 'should call on change a new value when the control is not active.', () => {
		// Check onClick handler for an inactive control.
		const inactiveControl = controls.find( ( control ) => ! control.isActive );
		inactiveControl.onClick();

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		// Should be called null when inactive control is clicked.
		expect( onChange ).toHaveBeenCalledWith( inactiveControl.align );
	} );
} );
