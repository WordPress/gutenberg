/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';
import { uniqueId } from 'lodash';

/**
 * Internal dependencies
 */
import { DimensionControl } from '../';

describe( 'DimensionControl', () => {
	const onChangeHandler = jest.fn();
	const onResetHandler = jest.fn();

	afterEach( () => {
		onChangeHandler.mockClear();
		onResetHandler.mockClear();
	} );

	describe( 'rendering correctly for different properties', () => {
		it( 'renders correctly for "padding" property', () => {
			const wrapper = shallow(
				<DimensionControl
					instanceId={ uniqueId() }
					title={ 'Padding' }
					property={ 'padding' }
				/>
			);
			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'renders correctly for "margin" property', () => {
			const wrapper = shallow(
				<DimensionControl
					instanceId={ uniqueId() }
					title={ 'Margin' }
					property={ 'margin' }
				/>
			);
			expect( wrapper ).toMatchSnapshot();
		} );
	} );

	describe( 'callbacks', () => {
		it( 'should call onSpacingChange handler with correct args on size button click', () => {
			const wrapper = mount(
				<DimensionControl
					instanceId={ uniqueId() }
					title={ 'Padding' }
					property={ 'padding' }
					onSpacingChange={ onChangeHandler }
				/>
			);

			wrapper.find( 'button[value="small"]' ).simulate( 'click' );

			expect( onChangeHandler ).toHaveBeenCalledTimes( 1 );
			expect( onChangeHandler ).toHaveBeenCalledWith( 'small' );
		} );

		it( 'should call onReset handler with correct args on reset button click', () => {
			const wrapper = mount(
				<DimensionControl
					instanceId={ uniqueId() }
					title={ 'Padding' }
					property={ 'padding' }
					onReset={ onResetHandler }
					device="desktop"
					currentSize={ 'medium' }
				/>
			);

			wrapper.find( 'button[aria-label="Reset Padding for desktop"]' ).simulate( 'click' );

			expect( onResetHandler ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
