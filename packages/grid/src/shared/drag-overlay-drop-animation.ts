/**
 * External dependencies
 */
import {
	defaultDropAnimation,
	defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import type { DropAnimation } from '@dnd-kit/core';

/** Matches `--wpds-motion-duration-md` on the drag preview frame exit. */
export const DROP_ANIMATION_DURATION_MS = 200;

/** Matches `--wpds-motion-easing-balanced` on the drag preview frame exit. */
const DROP_ANIMATION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * Composes @dnd-kit/core’s default overlay drop translation with preview
 * exit keyframes (via side effects). When the pointer never moves, @dnd-kit
 * skips the drop animation and these side effects do not run.
 *
 * @param dragPreviewFrameClassName Hashed class for `.drag-preview-frame`.
 * @param exitingFrameClassName     Hashed class for the exit state.
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
				frame
					.getAnimations()
					.forEach( ( animation ) => animation.cancel() );
				const lift = frame.firstElementChild;
				if ( lift instanceof HTMLElement ) {
					lift.getAnimations().forEach( ( animation ) =>
						animation.cancel()
					);
				}
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
