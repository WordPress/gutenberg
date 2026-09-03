import { render, screen } from '@testing-library/react';
import { press } from '@ariakit/test';
import { logged } from '@wordpress/deprecated';
import CircularOptionPicker from '..';

const SINGLE_OPTION = [ <CircularOptionPicker.Option key="option" /> ];

const MULTIPLE_OPTIONS = [
	<CircularOptionPicker.Option key="option-1" aria-label="Option One" />,
	<CircularOptionPicker.Option key="option-2" aria-label="Option Two" />,
];

const DEFAULT_PROPS = {
	'aria-label': 'Circular Option Picker',
	options: SINGLE_OPTION,
};
const AS_BUTTONS_DEPRECATION =
	'`asButtons` prop in wp.components.CircularOptionPicker is deprecated since version 7.2. Please use `presentation` instead. Note: `asButtons={ true }` maps to `presentation="toggle-buttons"`. Explicit `presentation` takes precedence.';

function getOption( name: string ) {
	return screen.getByRole( 'option', { name } );
}

describe( 'CircularOptionPicker', () => {
	beforeEach( () => {
		Object.keys( logged ).forEach( ( key ) => delete logged[ key ] );
	} );

	it( 'should preserve toggle-button semantics when an option is rendered without a picker', () => {
		render(
			<CircularOptionPicker.Option
				isSelected
				aria-label="Standalone option"
			/>
		);

		expect(
			screen.getByRole( 'button', {
				name: 'Standalone option',
				pressed: true,
			} )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'option' ) ).not.toBeInTheDocument();
	} );

	describe( 'when `asButtons` is not set', () => {
		it( 'should render as a listbox', async () => {
			render( <CircularOptionPicker { ...DEFAULT_PROPS } /> );

			expect( screen.getByRole( 'listbox' ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option' ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'when `asButtons` is false', () => {
		it( 'should render as a listbox', async () => {
			render(
				<CircularOptionPicker
					{ ...DEFAULT_PROPS }
					asButtons={ false }
				/>
			);

			expect( screen.getByRole( 'listbox' ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option' ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
			expect( console ).toHaveWarnedWith( AS_BUTTONS_DEPRECATION );
		} );
	} );

	describe( 'when `asButtons` is true', () => {
		it( 'should render as toggle buttons with selected and unselected states', async () => {
			render(
				<CircularOptionPicker
					{ ...DEFAULT_PROPS }
					asButtons
					options={ [
						<CircularOptionPicker.Option
							key="selected"
							isSelected
							aria-label="Selected"
						/>,
						<CircularOptionPicker.Option
							key="unselected"
							aria-label="Unselected"
						/>,
					] }
				/>
			);

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'option' ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'group' ) ).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', {
					name: 'Selected',
					pressed: true,
				} )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', {
					name: 'Unselected',
					pressed: false,
				} )
			).toBeInTheDocument();
			expect( console ).toHaveWarnedWith( AS_BUTTONS_DEPRECATION );
		} );
	} );

	describe( 'when `presentation` is set', () => {
		it( 'should render a selected listbox option', () => {
			render(
				<CircularOptionPicker
					{ ...DEFAULT_PROPS }
					presentation="listbox"
					options={ [
						<CircularOptionPicker.Option
							key="option"
							isSelected
							aria-label="Selected"
						/>,
					] }
				/>
			);

			expect(
				screen.getByRole( 'option', {
					name: 'Selected',
					selected: true,
				} )
			).toBeInTheDocument();
		} );

		it( 'should render toggle buttons with selected and unselected states', () => {
			render(
				<CircularOptionPicker
					{ ...DEFAULT_PROPS }
					presentation="toggle-buttons"
					options={ [
						<CircularOptionPicker.Option
							key="selected"
							isSelected
							aria-label="Selected"
						/>,
						<CircularOptionPicker.Option
							key="unselected"
							aria-label="Unselected"
						/>,
					] }
				/>
			);

			expect(
				screen.getByRole( 'button', {
					name: 'Selected',
					pressed: true,
				} )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', {
					name: 'Unselected',
					pressed: false,
				} )
			).toBeInTheDocument();
		} );

		it( 'should render command buttons without selection state or a selected check', () => {
			render(
				<CircularOptionPicker
					{ ...DEFAULT_PROPS }
					presentation="command-buttons"
					options={ [
						<CircularOptionPicker.Option
							key="option"
							isSelected
							aria-label="Edit"
						/>,
					] }
				/>
			);

			const button = screen.getByRole( 'button', { name: 'Edit' } );
			expect( button ).not.toHaveAttribute( 'aria-pressed' );
			expect( button ).not.toHaveAttribute( 'aria-selected' );
			// The selected check is decorative and therefore has no semantic query.
			// eslint-disable-next-line testing-library/no-node-access
			expect( button.nextElementSibling ).toBeNull();
		} );

		it( 'should prefer an explicit presentation over asButtons', () => {
			render(
				<CircularOptionPicker
					{ ...DEFAULT_PROPS }
					asButtons
					presentation="command-buttons"
				/>
			);

			expect( screen.getByRole( 'button' ) ).not.toHaveAttribute(
				'aria-pressed'
			);
			expect( console ).toHaveWarnedWith( AS_BUTTONS_DEPRECATION );
		} );
	} );

	describe( 'when `loop` is not set', () => {
		it( 'should loop', async () => {
			render(
				<CircularOptionPicker
					{ ...DEFAULT_PROPS }
					options={ MULTIPLE_OPTIONS }
				/>
			);

			await press.Tab();
			expect( getOption( 'Option One' ) ).toHaveFocus();
			await press.ArrowRight();
			expect( getOption( 'Option Two' ) ).toHaveFocus();
			await press.ArrowRight();
			expect( getOption( 'Option One' ) ).toHaveFocus();
		} );
	} );

	describe( 'when `loop` is true', () => {
		it( 'should loop', async () => {
			render(
				<CircularOptionPicker
					{ ...DEFAULT_PROPS }
					options={ MULTIPLE_OPTIONS }
					loop
				/>
			);

			await press.Tab();
			expect( getOption( 'Option One' ) ).toHaveFocus();
			await press.ArrowRight();
			expect( getOption( 'Option Two' ) ).toHaveFocus();
			await press.ArrowRight();
			expect( getOption( 'Option One' ) ).toHaveFocus();
		} );
	} );

	describe( 'when `loop` is false', () => {
		it( 'should not loop', async () => {
			render(
				<CircularOptionPicker
					{ ...DEFAULT_PROPS }
					loop={ false }
					options={ MULTIPLE_OPTIONS }
				/>
			);

			await press.Tab();
			expect( getOption( 'Option One' ) ).toHaveFocus();
			await press.ArrowRight();
			expect( getOption( 'Option Two' ) ).toHaveFocus();
			await press.ArrowRight();
			expect( getOption( 'Option Two' ) ).toHaveFocus();
		} );
	} );
} );
