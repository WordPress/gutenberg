/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { alignLeft, alignCenter } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import AlignmentUI from '../ui';

describe( 'AlignmentUI', () => {
	const alignment = 'left';
	const onChangeSpy = jest.fn();

	const wrapper = shallow(
		<AlignmentUI isToolbar value={ alignment } onChange={ onChangeSpy } />
	);

	const controls = wrapper.props().controls;

	afterEach( () => {
		onChangeSpy.mockClear();
	} );

	test( 'should match snapshot', () => {
		expect( wrapper ).toMatchSnapshot();
	} );

	test( 'should call on change with undefined when a control is already active', () => {
		const activeControl = controls.find( ( { isActive } ) => isActive );
		activeControl.onClick();

		expect( activeControl.align ).toBe( alignment );
		expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( onChangeSpy ).toHaveBeenCalledWith( undefined );
	} );

	test( 'should call on change a new value when the control is not active', () => {
		const inactiveControl = controls.find(
			( { align } ) => align === 'center'
		);
		inactiveControl.onClick();

		expect( inactiveControl.isActive ).toBe( false );
		expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( onChangeSpy ).toHaveBeenCalledWith( 'center' );
	} );

	test( 'should allow custom alignment controls to be specified', () => {
		const wrapperCustomControls = shallow(
			<AlignmentUI
				isToolbar
				value={ 'custom-right' }
				onChange={ onChangeSpy }
				alignmentControls={ [
					{
						icon: alignLeft,
						title: 'My custom left',
						align: 'custom-left',
					},
					{
						icon: alignCenter,
						title: 'My custom right',
						align: 'custom-right',
					},
				] }
			/>
		);
		expect( wrapperCustomControls ).toMatchSnapshot();
		const customControls = wrapperCustomControls.props().controls;
		expect( customControls ).toHaveLength( 2 );

		// Should correctly call on change when right alignment is pressed (active alignment)
		const rightControl = customControls.find(
			( { align } ) => align === 'custom-right'
		);
		expect( rightControl.title ).toBe( 'My custom right' );
		rightControl.onClick();
		expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( onChangeSpy ).toHaveBeenCalledWith( undefined );
		onChangeSpy.mockClear();

		// Should correctly call on change when right alignment is pressed (inactive alignment)
		const leftControl = customControls.find(
			( { align } ) => align === 'custom-left'
		);
		expect( leftControl.title ).toBe( 'My custom left' );
		leftControl.onClick();
		expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( onChangeSpy ).toHaveBeenCalledWith( 'custom-left' );
	} );
} );
