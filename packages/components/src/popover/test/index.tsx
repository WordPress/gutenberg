/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import type { CSSProperties } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { positionToPlacement, placementToMotionAnimationProps } from '../utils';
import Popover from '..';
import type { PopoverProps } from '../types';

type PositionToPlacementTuple = [
	NonNullable< PopoverProps[ 'position' ] >,
	NonNullable< PopoverProps[ 'placement' ] >
];
type PlacementToAnimationOriginTuple = [
	NonNullable< PopoverProps[ 'placement' ] >,
	number,
	number
];
type PlacementToInitialTranslationTuple = [
	NonNullable< PopoverProps[ 'placement' ] >,
	'translateY' | 'translateX',
	CSSProperties[ 'translate' ]
];

describe( 'Popover', () => {
	describe( 'Component', () => {
		describe( 'basic behavior', () => {
			it( 'should render content', () => {
				render( <Popover>Hello</Popover> );

				expect( screen.getByText( 'Hello' ) ).toBeInTheDocument();
			} );

			it( 'should forward additional props to portaled element', () => {
				render( <Popover role="tooltip">Hello</Popover> );

				expect( screen.getByRole( 'tooltip' ) ).toBeInTheDocument();
			} );
		} );

		describe( 'anchor', () => {
			it( 'should render correctly when anchor is provided', () => {
				const PopoverWithAnchor = ( args: PopoverProps ) => {
					// Use internal state instead of a ref to make sure that the component
					// re-renders when the popover's anchor updates.
					const [ anchor, setAnchor ] =
						useState< HTMLParagraphElement | null >( null );

					return (
						<div>
							<p ref={ setAnchor }>Anchor</p>
							<Popover { ...args } anchor={ anchor } />
						</div>
					);
				};

				render(
					<PopoverWithAnchor>Popover content</PopoverWithAnchor>
				);

				expect(
					screen.getByText( 'Popover content' )
				).toBeInTheDocument();
			} );
		} );

		describe( 'focus behavior', () => {
			it( 'should focus the popover by default when opened', () => {
				render( <Popover>Popover content</Popover> );

				expect(
					screen.getByText( 'Popover content' ).parentElement
				).toHaveFocus();
			} );

			it( 'should allow focus-on-open behavior to be disabled', () => {
				render(
					<Popover focusOnMount={ false }>Popover content</Popover>
				);

				expect( document.body ).toHaveFocus();
			} );
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
		] as PositionToPlacementTuple[] )(
			'converts `%s` to `%s`',
			( inputPosition, expectedPlacement ) => {
				expect( positionToPlacement( inputPosition ) ).toEqual(
					expectedPlacement
				);
			}
		);
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
			] as PlacementToAnimationOriginTuple[] )(
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
			] as PlacementToInitialTranslationTuple[] )(
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
