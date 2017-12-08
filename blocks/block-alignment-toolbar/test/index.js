/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { BlockAlignmentToolbar } from '../';

describe( 'BlockAlignmentToolbar', () => {
	const value = 'left';
	const onChange = jest.fn();

	const wrapper = shallow( <BlockAlignmentToolbar value={ value } onChange={ onChange } /> );

	const controls = wrapper.props().controls;

	beforeEach( () => {
		onChange.mockClear();
	} );

	test( 'should render the component.', () => {
		expect( wrapper ).toMatchSnapshot();
	} );

	test( 'should call onChange with undefined, when the control is already active.', () => {
		// Check onClick handler for an active control.
		controls.find( ( control ) => control.isActive ).onClick();

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		// Should be called null when active control is clicked.
		expect( onChange ).toHaveBeenCalledWith( undefined );
	} );

	test( 'should call onChange when the control is inactive.', () => {
		// Check onClick handler for an inactive control.
		const inactiveControl = controls.find( ( control ) => ! control.isActive );
		inactiveControl.onClick();

		expect( onChange ).toHaveBeenCalledTimes( 1 );
	} );
} );
