/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
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

// There's no matching `placement` for 'middle center' positions,
// fallback to 'bottom' (same as `floating-ui`'s default.)
const FALLBACK_FOR_MIDDLE_CENTER_POSITIONS = 'bottom';

const ALL_POSITIONS_TO_EXPECTED_PLACEMENTS: PositionToPlacementTuple[] = [
	// Format: [yAxis]
	[ 'middle', FALLBACK_FOR_MIDDLE_CENTER_POSITIONS ],
	[ 'bottom', 'bottom' ],
	[ 'top', 'top' ],
	// Format: [yAxis] [xAxis]
	[ 'middle left', 'left' ],
	[ 'middle center', FALLBACK_FOR_MIDDLE_CENTER_POSITIONS ],
	[ 'middle right', 'right' ],
	[ 'bottom left', 'bottom-end' ],
	[ 'bottom center', 'bottom' ],
	[ 'bottom right', 'bottom-start' ],
	[ 'top left', 'top-end' ],
	[ 'top center', 'top' ],
	[ 'top right', 'top-start' ],
	// Format: [yAxis] [xAxis] [corner]
	[ 'middle left left', 'left' ],
	[ 'middle left right', 'left' ],
	[ 'middle left bottom', 'left-end' ],
	[ 'middle left top', 'left-start' ],
	[ 'middle center left', FALLBACK_FOR_MIDDLE_CENTER_POSITIONS ],
	[ 'middle center right', FALLBACK_FOR_MIDDLE_CENTER_POSITIONS ],
	[ 'middle center bottom', FALLBACK_FOR_MIDDLE_CENTER_POSITIONS ],
	[ 'middle center top', FALLBACK_FOR_MIDDLE_CENTER_POSITIONS ],
	[ 'middle right left', 'right' ],
	[ 'middle right right', 'right' ],
	[ 'middle right bottom', 'right-end' ],
	[ 'middle right top', 'right-start' ],
	[ 'bottom left left', 'bottom-end' ],
	[ 'bottom left right', 'bottom-end' ],
	[ 'bottom left bottom', 'bottom-end' ],
	[ 'bottom left top', 'bottom-end' ],
	[ 'bottom center left', 'bottom' ],
	[ 'bottom center right', 'bottom' ],
	[ 'bottom center bottom', 'bottom' ],
	[ 'bottom center top', 'bottom' ],
	[ 'bottom right left', 'bottom-start' ],
	[ 'bottom right right', 'bottom-start' ],
	[ 'bottom right bottom', 'bottom-start' ],
	[ 'bottom right top', 'bottom-start' ],
	[ 'top left left', 'top-end' ],
	[ 'top left right', 'top-end' ],
	[ 'top left bottom', 'top-end' ],
	[ 'top left top', 'top-end' ],
	[ 'top center left', 'top' ],
	[ 'top center right', 'top' ],
	[ 'top center bottom', 'top' ],
	[ 'top center top', 'top' ],
	[ 'top right left', 'top-start' ],
	[ 'top right right', 'top-start' ],
	[ 'top right bottom', 'top-start' ],
	[ 'top right top', 'top-start' ],
];

describe( 'Popover', () => {
	describe( 'Component', () => {
		describe( 'basic behavior', () => {
			it( 'should render content', async () => {
				render( <Popover>Hello</Popover> );

				await waitFor( () =>
					expect( screen.getByText( 'Hello' ) ).toBeVisible()
				);
			} );

			it( 'should forward additional props to portaled element', async () => {
				render( <Popover role="tooltip">Hello</Popover> );

				await waitFor( () =>
					expect( screen.getByRole( 'tooltip' ) ).toBeVisible()
				);
			} );
		} );

		describe( 'anchor', () => {
			it( 'should render correctly when anchor is provided', async () => {
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

				await waitFor( () =>
					expect(
						screen.getByText( 'Popover content' )
					).toBeVisible()
				);
			} );
		} );

		describe( 'focus behavior', () => {
			it( 'should focus the popover container when opened', async () => {
				render(
					<Popover
						focusOnMount={ true }
						data-testid="popover-element"
					>
						Popover content
					</Popover>
				);

				const popover = screen.getByTestId( 'popover-element' );

				await waitFor( () => expect( popover ).toBeVisible() );

				expect( popover ).toHaveFocus();
			} );

			it( 'should allow focus-on-open behavior to be disabled', async () => {
				render(
					<Popover focusOnMount={ false }>Popover content</Popover>
				);

				await waitFor( () =>
					expect(
						screen.getByText( 'Popover content' )
					).toBeVisible()
				);

				expect( document.body ).toHaveFocus();
			} );
		} );
	} );

	describe( 'positionToPlacement', () => {
		it.each( ALL_POSITIONS_TO_EXPECTED_PLACEMENTS )(
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
