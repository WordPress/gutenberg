import { render, screen, within } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Calendar, RangeCalendar } from '..';

describe.each( [
	[ 'Calendar', Calendar, 'Date calendar' ],
	[ 'RangeCalendar', RangeCalendar, 'Date range calendar' ],
] )( '%s', ( _name, Component, defaultLabel ) => {
	describe( 'root role', () => {
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

		it( 'should preserve the default label for the `application` role', () => {
			render( <Component role="application" /> );

			expect(
				screen.getByRole( 'application', { name: defaultLabel } )
			).toBeVisible();
		} );

		it.each( [ 'none', 'presentation' ] as const )(
			'should omit the default root label when the role is `%s`',
			( role ) => {
				render(
					<Component role={ role } data-testid="calendar-root" />
				);
				const root = screen.getByTestId( 'calendar-root' );

				expect( root ).toHaveAttribute( 'role', role );
				expect( root ).not.toHaveAttribute( 'aria-label' );
			}
		);
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
