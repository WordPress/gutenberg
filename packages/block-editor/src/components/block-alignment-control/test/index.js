/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BlockAlignmentToolbar } from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test
	const mock = jest.fn();
	return mock;
} );
useSelect.mockImplementation( () => ( { wideControlsEnabled: false } ) );

describe( 'BlockAlignmentToolbar', () => {
	const alignment = 'left';
	const onChange = jest.fn();

	const wrapper = shallow(
		<BlockAlignmentToolbar value={ alignment } onChange={ onChange } />
	);

	const controls = wrapper.props().controls;

	afterEach( () => {
		onChange.mockClear();
	} );

	test( 'should match snapshot', () => {
		expect( wrapper ).toMatchSnapshot();
	} );

	test( 'should call onChange with undefined, when the control is already active', () => {
		const activeControl = controls.find(
			( { title } ) => title === 'Align left'
		);
		activeControl.onClick();

		expect( activeControl.isActive ).toBe( true );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( undefined );
	} );

	test( 'should call onChange with alignment value when the control is inactive', () => {
		const inactiveCenterControl = controls.find(
			( { title } ) => title === 'Align center'
		);
		inactiveCenterControl.onClick();

		expect( inactiveCenterControl.isActive ).toBe( false );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( 'center' );
	} );
} );
