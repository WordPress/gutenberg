import { render, screen, within } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Calendar, RangeCalendar } from '..';

describe.each( [
	[ 'Calendar', Calendar ],
	[ 'RangeCalendar', RangeCalendar ],
] )( '%s', ( _name, Component ) => {
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
