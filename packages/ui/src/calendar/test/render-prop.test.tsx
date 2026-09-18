import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useId } from '@wordpress/element';
import { Calendar, RangeCalendar } from '..';

describe.each( [
	[ 'Calendar', Calendar, 'Date calendar' ],
	[ 'RangeCalendar', RangeCalendar, 'Date range calendar' ],
] )( '%s', ( _name, Component, defaultLabel ) => {
	describe( 'root role', () => {
		const may2025 = new Date( 2025, 4, 1 );

		it( 'should update the default application label when navigating between months', async () => {
			const user = userEvent.setup();
			render( <Component defaultMonth={ may2025 } /> );

			await user.click(
				screen.getByRole( 'button', { name: /next month/i } )
			);

			expect(
				screen.getByRole( 'application', {
					name: `${ defaultLabel }, June 2025`,
				} )
			).toBeVisible();
		} );

		it( 'should forward a custom root role', () => {
			render(
				<Component role="region" aria-label="Availability calendar" />
			);

			expect(
				screen.getByRole( 'region', {
					name: 'Availability calendar',
				} )
			).toBeVisible();
		} );

		it( 'should let an explicit aria-label replace the generated application label', () => {
			render(
				<Component
					defaultMonth={ may2025 }
					aria-label="Availability calendar"
				/>
			);

			const root = screen.getByRole( 'application', {
				name: 'Availability calendar',
			} );
			expect( root ).toHaveAttribute(
				'aria-label',
				'Availability calendar'
			);
		} );

		it( 'should let aria-labelledby replace the generated application label', () => {
			function LabelledCalendar() {
				const headingId = useId();
				return (
					<>
						<h2 id={ headingId }>Availability calendar</h2>
						<Component
							defaultMonth={ may2025 }
							aria-labelledby={ headingId }
						/>
					</>
				);
			}

			render( <LabelledCalendar /> );

			const root = screen.getByRole( 'application', {
				name: 'Availability calendar',
			} );
			expect( root ).not.toHaveAttribute( 'aria-label' );
		} );
	} );

	describe( 'render prop', () => {
		it( 'should render a `div` by default', () => {
			render( <Component aria-label="Test calendar" /> );

			expect( screen.getByLabelText( 'Test calendar' ).tagName ).toBe(
				'DIV'
			);
		} );

		it( 'should replace the root element when `render` is provided', () => {
			render(
				<Component aria-label="Test calendar" render={ <section /> } />
			);

			const root = screen.getByLabelText( 'Test calendar' );
			expect( root.tagName ).toBe( 'SECTION' );
			// The calendar still renders its contents inside the custom element.
			expect( within( root ).getByRole( 'grid' ) ).toBeVisible();
		} );

		it( 'should merge the class names of the custom element with the calendar ones', () => {
			render(
				<Component
					aria-label="Test calendar"
					className="from-prop"
					render={ <section className="from-render" /> }
				/>
			);

			const root = screen.getByLabelText( 'Test calendar' );
			expect( root ).toHaveClass( 'from-prop' );
			expect( root ).toHaveClass( 'from-render' );
		} );

		it( 'should not remount the calendar when an inline `render` element is re-created', () => {
			const { rerender } = render(
				<Component aria-label="Test calendar" render={ <section /> } />
			);

			const rootBefore = screen.getByLabelText( 'Test calendar' );

			// Re-render with a brand new `render` element object.
			rerender(
				<Component aria-label="Test calendar" render={ <section /> } />
			);

			expect( screen.getByLabelText( 'Test calendar' ) ).toBe(
				rootBefore
			);
		} );
	} );

	describe( 'ref forwarding', () => {
		it( 'should forward the ref to the root element', () => {
			const ref = createRef< HTMLDivElement >();
			render( <Component aria-label="Test calendar" ref={ ref } /> );

			expect( ref.current ).toBe(
				screen.getByLabelText( 'Test calendar' )
			);
		} );

		it( 'should forward the ref to the element provided through `render`', () => {
			const ref = createRef< HTMLDivElement >();
			render(
				<Component
					aria-label="Test calendar"
					ref={ ref }
					render={ <section /> }
				/>
			);

			expect( ref.current ).toBe(
				screen.getByLabelText( 'Test calendar' )
			);
			expect( ref.current?.tagName ).toBe( 'SECTION' );
		} );
	} );
} );
