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

import { positionToPlacement, placementToMotionAnimationProps } from '../utils';

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

	describe( 'placementToMotionAnimationProps', () => {
		describe( 'animation origin', () => {
			it.each( [
				[ 'top', 0.5, 1 ],
				[ 'top-start', 0, 1 ],
				[ 'top-end', 1, 1 ],
				[ 'right', 0, 0.5 ],
				[ 'right-start', 0, 0 ],
				[ 'right-end', 0, 1 ],
				[ 'bottom', 0.5, 0 ],
				[ 'bottom-start', 0, 0 ],
				[ 'bottom-end', 1, 0 ],
				[ 'left', 1, 0.5 ],
				[ 'left-start', 1, 0 ],
				[ 'left-end', 1, 1 ],
			] )(
				'for the `%s` placement computes an animation origin of (%d, %d)',
				( inputPlacement, expectedOriginX, expectedOriginY ) => {
					expect(
						placementToMotionAnimationProps( inputPlacement )
					).toEqual(
						expect.objectContaining( {
							style: expect.objectContaining( {
								originX: expectedOriginX,
								originY: expectedOriginY,
							} ),
						} )
					);
				}
			);
		} );
		describe( 'initial translation', () => {
			it.each( [
				[ 'top', 'translateY', '2em' ],
				[ 'top-start', 'translateY', '2em' ],
				[ 'top-end', 'translateY', '2em' ],
				[ 'right', 'translateX', '-2em' ],
				[ 'right-start', 'translateX', '-2em' ],
				[ 'right-end', 'translateX', '-2em' ],
				[ 'bottom', 'translateY', '-2em' ],
				[ 'bottom-start', 'translateY', '-2em' ],
				[ 'bottom-end', 'translateY', '-2em' ],
				[ 'left', 'translateX', '2em' ],
				[ 'left-start', 'translateX', '2em' ],
				[ 'left-end', 'translateX', '2em' ],
			] )(
				'for the `%s` placement computes an initial `%s` of `%s',
				(
					inputPlacement,
					expectedTranslationProp,
					expectedTranslationValue
				) => {
					expect(
						placementToMotionAnimationProps( inputPlacement )
					).toEqual(
						expect.objectContaining( {
							initial: expect.objectContaining( {
								[ expectedTranslationProp ]:
									expectedTranslationValue,
							} ),
						} )
					);
				}
			);
		} );
	} );
} );
