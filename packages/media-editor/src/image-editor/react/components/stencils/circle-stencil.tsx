/**
 * Internal dependencies
 */
import type { StencilProps } from '../../../core/types';
import { RectangleStencil } from './rectangle-stencil';

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
			stencilRectClassName="wp-media-editor-image-editor__stencil-rect--circle"
		/>
	);
}
