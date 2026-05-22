/**
 * External dependencies
 */
import {
	defaultDropAnimation,
	defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import type { DropAnimation } from '@dnd-kit/core';

/**
 * Matches `--wpds-motion-duration-md` (200ms) and
 * `--wpds-motion-easing-balanced` on the drag preview frame exit.
 */
const DROP_ANIMATION_DURATION_MS = 200;
const DROP_ANIMATION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * Composes @dnd-kit/core’s default overlay drop animation with a CSS
 * transition on the inner drag preview frame (scale + shadow) so
 * release does not snap before the overlay unmounts.
 *
 * @param dragPreviewFrameClassName Hashed class for `.drag-preview-frame`
 *                                  (e.g. `styles[ 'drag-preview-frame' ]`).
 * @param exitingFrameClassName     Hashed class for the exit state (e.g.
 *                                  `styles.dragPreviewFrameExiting`).
 */
export function createDashboardDragDropAnimation(
	dragPreviewFrameClassName: string,
	exitingFrameClassName: string
): DropAnimation {
	return {
		...defaultDropAnimation,
		duration: DROP_ANIMATION_DURATION_MS,
		easing: DROP_ANIMATION_EASING,
		sideEffects( args ) {
			const cleanupDefault = defaultDropAnimationSideEffects( {
				styles: {
					active: {
						opacity: '0',
					},
				},
			} )( args );

			const frame = args.dragOverlay.node.getElementsByClassName(
				dragPreviewFrameClassName
			)[ 0 ] as HTMLElement | undefined;

			if ( frame ) {
				frame.classList.add( exitingFrameClassName );
			}

			return () => {
				cleanupDefault?.();
				if ( frame ) {
					frame.classList.remove( exitingFrameClassName );
				}
			};
		},
	};
}
