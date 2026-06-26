/**
 * Internal dependencies
 */
import type { HandlePosition } from '../../../core/stencil-math';
import type { StencilProps } from '../../../core/types';
import { RectangleStencil } from './rectangle-stencil';

const CIRCLE_HANDLE_POSITIONS: HandlePosition[] = [ 'n', 'e', 's', 'w' ];

/**
 * Circular crop stencil.
 *
 * The cropper state still stores a rectangular bounding box; this stencil
 * renders that box as a circle and locks resize math to a square.
 *
 * @param props Component props implementing StencilProps.
 * @return The circle stencil element.
 */
export function CircleStencil( props: StencilProps ) {
	return (
		<RectangleStencil
			{ ...props }
			aspectRatio={ 1 }
			className="wp-media-editor-image-editor__stencil--circle"
			lockedHandlePositions={ CIRCLE_HANDLE_POSITIONS }
			stencilRectClassName="wp-media-editor-image-editor__stencil-rect--circle"
		/>
	);
}
