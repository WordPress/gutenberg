/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';
import { uniqueId } from 'lodash';

/**
 * Internal dependencies
 */
import DimensionButtons from '../buttons';

describe( 'DimensionButtons', () => {
	const onChangeHandler = jest.fn();

	const sizesTable = [
		{
			name: 'None',
			abbr: 'No',
			size: 0,
			slug: 'none',
		},
		{
			name: 'Small',
			abbr: 'S',
			size: 14,
			slug: 'small',
		},
		{
			name: 'Medium',
			abbr: 'M',
			size: 24,
			slug: 'medium',
		},
		{
			name: 'Large',
			abbr: 'L',
			size: 34,
			slug: 'large',
		}, {
			name: 'Extra Large',
			abbr: 'XL',
			size: 60,
			slug: 'xlarge',
		},
	];

	afterEach( () => {
		onChangeHandler.mockClear();
	} );

	it( 'renders correctly with defaults', () => {
		const wrapper = shallow(
			<DimensionButtons
				id={ uniqueId() }
				sizes={ sizesTable }
			/>
		);
		expect( wrapper ).toMatchSnapshot();
	} );

	describe( 'required props', () => {
		it( 'does not render without a "id" prop', () => {
			const wrapper = shallow(
				<DimensionButtons
					sizes={ sizesTable } // providethe other required prop
				/>
			);

			expect( wrapper.isEmptyRender() ).toBe( true );
		} );

		it( 'does not render without a "sizes" prop', () => {
			const wrapper = shallow(
				<DimensionButtons
					id={ uniqueId() } // providethe other required prop
				/>
			);

			expect( wrapper.isEmptyRender() ).toBe( true );
		} );
	} );

	describe( 'selected states', () => {
		it( 'renders a selected button state for the matching "currentSize" prop', () => {
			const size = 'medium';

			const wrapper = mount(
				<DimensionButtons
					id={ uniqueId() }
					sizes={ sizesTable }
					currentSize={ size }
				/>
			);

			const selectedButton = wrapper.find( 'button' ).filter( '.is-primary' );

			expect( selectedButton ).toHaveLength( 1 );
			expect( selectedButton.prop( 'value' ) ).toBe( size );
			expect( selectedButton.prop( 'aria-pressed' ) ).toBe( true );
		} );

		it( 'does not render a selected button if no matching "currentSize" prop is provided', () => {
			const wrapper = mount(
				<DimensionButtons
					id={ uniqueId() }
					sizes={ sizesTable }
					currentSize="invalidsizehere"
				/>
			);

			const unpressedButtons = wrapper.find( 'button' ).filterWhere( ( button ) => {
				return false === button.prop( 'aria-pressed' );
			} );

			const pressedButtons = wrapper.find( 'button' ).filterWhere( ( button ) => {
				return true === button.prop( 'aria-pressed' );
			} );

			expect( wrapper.find( 'button' ).filter( '.is-primary' ) ).toHaveLength( 0 );
			expect( pressedButtons ).toHaveLength( 0 );
			expect( unpressedButtons ).toHaveLength( sizesTable.length );
		} );
	} );

	describe( 'callbacks', () => {
		it( 'triggers onChangeSpacingSize callback on button click', () => {
			const wrapper = mount(
				<DimensionButtons
					id={ uniqueId() }
					sizes={ sizesTable }
					currentSize="medium"
					onChangeSpacingSize={ onChangeHandler }
				/>
			);

			wrapper.find( 'button[value="small"]' ).simulate( 'click' );

			expect( onChangeHandler ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
