import { Resizable } from 're-resizable';
import type { MouseEvent, TouchEvent } from 'react';
import {
	getHandleVector,
	getResizeStep,
	getViewportLinearTransform,
	isIdentity,
	measureGain,
	toLocalDelta,
} from './utils';
import type { HandleDirection, LinearTransform } from './utils';

type Point = { x: number; y: number };
type Size = { width: number; height: number };

type TransformedDrag = {
	matrix: LinearTransform;
	handleElement: Element;
	gain: number;
	grab?: Point;
	last?: { size: Size; handle: Point };
	pointer?: Point;
	frame?: number;
	settles: number;
	isSettling: boolean;
	cannotFollow?: boolean;
};

// Below the minimum, the handle cannot follow the pointer, like one on a
// block turned 180deg. Above the maximum is a measuring glitch.
const MIN_GAIN = 0.2;
const MAX_GAIN = 2;
const MAX_SETTLES = 10;

/**
 * Keeps the dragged handle under the pointer when the box or an ancestor is
 * rotated or scaled.
 *
 * `re-resizable` reads pointer movement in screen axes and has no option for
 * a rotation, which mixes the axes. Its `scale` and `resizeRatio` props only
 * stretch each axis. So this overrides `calculateNewSizeFromDirection()`,
 * which is public but undocumented, and feeds it a pointer position that
 * gives the size wanted.
 *
 * The size comes from where the handle is on screen, not from the transform
 * alone. A transform origin at the block's centre moves as the block grows,
 * so the handle covers less ground than the box grows. The gain between the
 * two is measured on each move, and the box grows until the handle meets the
 * pointer.
 */
export class TransformAwareResizable extends Resizable {
	transformedDrag?: TransformedDrag;

	onResizeStart(
		event: MouseEvent< HTMLElement > | TouchEvent< HTMLElement >,
		direction: HandleDirection
	) {
		super.onResizeStart( event, direction );
		this.stopTransformedDrag();
		// An explicit `scale` prop already corrects the movement.
		if ( ! this.resizable || ( this.props.scale ?? 1 ) !== 1 ) {
			return;
		}
		const matrix = getViewportLinearTransform( this.resizable );
		if ( ! isIdentity( matrix ) ) {
			this.transformedDrag = {
				matrix,
				handleElement: event.currentTarget,
				gain: 1,
				settles: 0,
				isSettling: false,
			};
		}
	}

	onMouseUp( event: globalThis.MouseEvent | globalThis.TouchEvent ) {
		this.stopTransformedDrag();
		super.onMouseUp( event );
	}

	componentWillUnmount() {
		this.stopTransformedDrag();
		super.componentWillUnmount();
	}

	stopTransformedDrag() {
		if ( this.transformedDrag?.frame ) {
			this.window?.cancelAnimationFrame( this.transformedDrag.frame );
		}
		this.transformedDrag = undefined;
	}

	calculateNewSizeFromDirection( clientX: number, clientY: number ) {
		const drag = this.transformedDrag;
		if ( ! drag || ! this.resizable ) {
			return super.calculateNewSizeFromDirection( clientX, clientY );
		}
		const { direction, original } = this.state;
		const rect = drag.handleElement.getBoundingClientRect();
		const handle = {
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2,
		};
		if ( ! drag.isSettling ) {
			drag.settles = 0;
		}
		// Where the pointer first caught the handle, so the box doesn't jump
		// to centre the handle under it.
		drag.grab ??= { x: original.x - handle.x, y: original.y - handle.y };
		drag.pointer = { x: clientX, y: clientY };

		const size = {
			width: this.resizable.offsetWidth,
			height: this.resizable.offsetHeight,
		};
		if ( drag.last ) {
			const gain = measureGain(
				drag.matrix,
				direction,
				{
					width: size.width - drag.last.size.width,
					height: size.height - drag.last.size.height,
				},
				{
					x: handle.x - drag.last.handle.x,
					y: handle.y - drag.last.handle.y,
				}
			);
			if ( gain !== undefined && gain < MIN_GAIN ) {
				drag.cannotFollow = true;
			} else if ( gain !== undefined && gain <= MAX_GAIN ) {
				drag.gain = gain;
			}
		}
		drag.last = { size, handle };

		// The handle doesn't move with the size, so map the pointer's
		// movement into the box's axes instead of chasing it.
		if ( drag.cannotFollow ) {
			const local = toLocalDelta(
				drag.matrix,
				clientX - original.x,
				clientY - original.y
			);
			return super.calculateNewSizeFromDirection(
				original.x + local.x,
				original.y + local.y
			);
		}

		const step = getResizeStep(
			drag.matrix,
			direction,
			{
				x: clientX - drag.grab.x - handle.x,
				y: clientY - drag.grab.y - handle.y,
			},
			drag.gain
		);
		if ( Math.abs( step.width ) >= 0.5 || Math.abs( step.height ) >= 0.5 ) {
			this.scheduleSettle( drag );
		}

		// Turn the size wanted back into the pointer position that gives it.
		const [ ratioX, ratioY ] = Array.isArray( this.props.resizeRatio )
			? this.props.resizeRatio
			: [ this.props.resizeRatio ?? 1, this.props.resizeRatio ?? 1 ];
		const [ x, y ] = getHandleVector( direction );
		return super.calculateNewSizeFromDirection(
			original.x +
				( x * ( size.width + step.width - original.width ) ) / ratioX,
			original.y +
				( y * ( size.height + step.height - original.height ) ) / ratioY
		);
	}

	// The pointer can stop before the handle has caught up, so keep going
	// for a few frames. Wait two, so a consumer that resizes its own content
	// in `onResize` has rendered before the handle is measured again.
	scheduleSettle( drag: TransformedDrag ) {
		const view = this.window;
		if ( ! view || drag.frame || drag.settles >= MAX_SETTLES ) {
			return;
		}
		drag.frame = view.requestAnimationFrame( () => {
			drag.frame = view.requestAnimationFrame( () => {
				drag.frame = undefined;
				if ( this.transformedDrag !== drag || ! drag.pointer ) {
					return;
				}
				drag.settles++;
				drag.isSettling = true;
				this.onMouseMove(
					new view.MouseEvent( 'mousemove', {
						clientX: drag.pointer.x,
						clientY: drag.pointer.y,
					} )
				);
				drag.isSettling = false;
			} );
		} );
	}
}
