import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen, waitFor, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { getWpCompatOverlaySlot } from '@wordpress/ui';
import AlignmentMatrixControl from '..';

const getControl = () => {
	return screen.getByRole( 'grid' );
};

const getCell = ( name: string ) => {
	return within( getControl() ).getByRole( 'gridcell', { name } );
};

const renderAndInitCompositeStore = async (
	jsx: React.JSX.Element,
	focusedCell = 'Center'
) => {
	const view = await render( jsx );
	await waitFor( () => {
		expect( getCell( focusedCell ) ).toHaveAttribute( 'tabindex', '0' );
	} );
	return view;
};

describe( 'AlignmentMatrixControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', async () => {
			await renderAndInitCompositeStore( <AlignmentMatrixControl /> );

			expect( getControl() ).toBeInTheDocument();
		} );

		it( 'should be centered by default', async () => {
			await renderAndInitCompositeStore(
				<>
					<button type="button">Before</button>
					<AlignmentMatrixControl />
				</>
			);
			const before = screen.getByRole( 'button', { name: 'Before' } );
			await userEvent.click( before );
			expect( before ).toHaveFocus();

			await userEvent.tab();

			expect( getCell( 'Center' ) ).toHaveFocus();
		} );

		it( 'should show the cell label in a tooltip in the overlay slot', async () => {
			await renderAndInitCompositeStore( <AlignmentMatrixControl /> );

			await userEvent.hover( getCell( 'Top Left' ) );

			const slot = getWpCompatOverlaySlot();
			expect( slot ).toBeDefined();
			await waitFor( () =>
				expect(
					within( slot as HTMLDivElement ).getByText( 'Top Left' )
				).toBeVisible()
			);
		} );
	} );

	describe( 'Should change value', () => {
		describe( 'with Mouse', () => {
			describe( 'on cell click', () => {
				it.each( [
					[ 'Top Left', 'top left' ],
					[ 'Top Center', 'top center' ],
					[ 'Top Right', 'top right' ],
					[ 'Center Left', 'center left' ],
					[ 'Center Right', 'center right' ],
					[ 'Bottom Left', 'bottom left' ],
					[ 'Bottom Center', 'bottom center' ],
					[ 'Bottom Right', 'bottom right' ],
				] )( '%s', async ( name, alignment ) => {
					const spy = vi.fn();

					await renderAndInitCompositeStore(
						<AlignmentMatrixControl
							value="center"
							onChange={ spy }
						/>
					);

					const cell = getCell( name );

					await userEvent.click( cell );

					expect( cell ).toHaveFocus();
					expect( spy ).toHaveBeenCalledWith( alignment );
				} );

				it( 'unless already focused', async () => {
					const spy = vi.fn();

					await renderAndInitCompositeStore(
						<AlignmentMatrixControl
							value="center"
							onChange={ spy }
						/>
					);

					const cell = getCell( 'Center' );

					await userEvent.click( cell );

					expect( cell ).toHaveFocus();
					expect( spy ).not.toHaveBeenCalled();
				} );
			} );
		} );

		describe( 'with Keyboard', () => {
			describe( 'on arrow press', () => {
				it.each( [
					[ 'ArrowUp', 'Top Center', 'top center' ],
					[ 'ArrowLeft', 'Center Left', 'center left' ],
					[ 'ArrowDown', 'Bottom Center', 'bottom center' ],
					[ 'ArrowRight', 'Center Right', 'center right' ],
				] as const )( '%s', async ( keyRef, cellName, cellRef ) => {
					const spy = vi.fn();

					await renderAndInitCompositeStore(
						<AlignmentMatrixControl onChange={ spy } />
					);

					await userEvent.click( getCell( 'Center' ) );
					await userEvent.keyboard( `{${ keyRef }}` );

					expect( getCell( cellName ) ).toHaveFocus();
					expect( spy ).toHaveBeenCalledWith( cellRef );
				} );
			} );

			describe( 'but not at at edge', () => {
				it.each( [
					[ 'ArrowUp', 'Top Left', 'top left' ],
					[ 'ArrowLeft', 'Top Left', 'top left' ],
					[ 'ArrowDown', 'Bottom Right', 'bottom right' ],
					[ 'ArrowRight', 'Bottom Right', 'bottom right' ],
				] as const )( '%s', async ( keyRef, cellName, cellRef ) => {
					const spy = vi.fn();

					await renderAndInitCompositeStore(
						<AlignmentMatrixControl onChange={ spy } />
					);

					const cell = getCell( cellName );
					await userEvent.click( cell );
					await userEvent.keyboard( `{${ keyRef }}` );

					expect( cell ).toHaveFocus();
					expect( spy ).toHaveBeenCalledWith( cellRef );
				} );
			} );
		} );
	} );
} );
