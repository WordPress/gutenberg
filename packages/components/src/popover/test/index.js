/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Popover from '../';
import { positionToPlacement } from '../utils';

describe( 'Popover', () => {
	describe( 'Component', () => {
		afterEach( () => {
			if ( document.activeElement ) {
				document.activeElement.blur();
			}
		} );

		it( 'should allow focus-on-open behavior to be disabled', () => {
			expect( document.activeElement ).toBe( document.body );

			act( () => {
				render( <Popover focusOnMount={ false } /> );

				jest.advanceTimersByTime( 1 );
			} );

			expect( document.activeElement ).toBe( document.body );
		} );

		it( 'should render content', () => {
			let result;
			act( () => {
				result = render( <Popover>Hello</Popover> );
			} );

			expect(
				result.container.querySelector( 'span' )
			).toMatchSnapshot();
		} );

		it( 'should pass additional props to portaled element', () => {
			let result;
			act( () => {
				result = render( <Popover role="tooltip">Hello</Popover> );
			} );

			expect(
				result.container.querySelector( 'span' )
			).toMatchSnapshot();
		} );

		it( 'should render correctly when anchorRef is provided', () => {
			const PopoverWithAnchor = ( args ) => {
				const anchorRef = useRef( null );

				return (
					<div>
						<p ref={ anchorRef }>Anchor</p>
						<Popover { ...args } anchorRef={ anchorRef } />
					</div>
				);
			};

			render( <PopoverWithAnchor>Popover content</PopoverWithAnchor> );

			expect( screen.getByText( 'Popover content' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'positionToPlacement', () => {
		it.each( [
			[ 'top left', 'top-end' ],
			[ 'top center', 'top' ],
			[ 'top right', 'top-start' ],
			[ 'middle left', 'left' ],
			[ 'middle center', 'center' ],
			[ 'middle right', 'right' ],
			[ 'bottom left', 'bottom-end' ],
			[ 'bottom center', 'bottom' ],
			[ 'bottom right', 'bottom-start' ],
		] )( 'converts `%s` to `%s`', ( inputPosition, expectedPlacement ) => {
			expect( positionToPlacement( inputPosition ) ).toEqual(
				expectedPlacement
			);
		} );
	} );
} );
