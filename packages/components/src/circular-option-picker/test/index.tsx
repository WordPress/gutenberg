/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { press } from '@ariakit/test';

/**
 * Internal dependencies
 */
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

function getOption( name: string ) {
	return screen.getByRole( 'option', { name } );
}

describe( 'CircularOptionPicker', () => {
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
		} );
	} );

	describe( 'when `asButtons` is true', () => {
		it( 'should render as buttons', async () => {
			render( <CircularOptionPicker { ...DEFAULT_PROPS } asButtons /> );

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'option' ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'group' ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button' ) ).toBeInTheDocument();
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
