/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { StencilProps, NormalizedRect } from '../../core/types';

/**
 * Handle position identifiers for the 8 resize handles.
 */
type HandlePosition = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

/**
 * All handle positions rendered by the stencil.
 */
const HANDLE_POSITIONS: HandlePosition[] = [
	'n',
	's',
	'e',
	'w',
	'nw',
	'ne',
	'sw',
	'se',
];

/**
 * Internal drag state for tracking a resize interaction.
 */
interface DragState {
	/** Which handle is being dragged. */
	handle: HandlePosition;
	/** The mouse position (pixels) when the drag started. */
	startX: number;
	startY: number;
	/** The crop rect (normalized) when the drag started. */
	startRect: NormalizedRect;
}

/**
 * Props for the RectangleStencil component.
 */
interface RectangleStencilProps extends StencilProps {
	/** Optional fixed aspect ratio (width / height). */
	aspectRatio?: number;
}

/**
 * A rectangular crop stencil with 8 resize handles.
 *
 * Renders a rectangle overlay positioned according to the normalized
 * crop rect, with draggable handles on corners and edges.
 *
 * @param props               Component props implementing StencilProps.
 * @param props.cropRect      The crop rectangle in normalized coordinates.
 * @param props.containerSize The container element dimensions in pixels.
 * @param props.imageSize     The rendered image dimensions in pixels.
 * @param props.onCropChange  Callback fired when the crop rect changes.
 * @param props.aspectRatio   Optional fixed aspect ratio (width / height).
 * @return The rectangle stencil element.
 */
export function RectangleStencil( {
	cropRect,
	containerSize,
	imageSize,
	onCropChange,
	aspectRatio,
}: RectangleStencilProps ) {
	const [ dragState, setDragState ] = useState< DragState | null >( null );

	// Convert normalized crop rect to pixel bounds, accounting for the
	// image offset within the container.
	const offsetX = ( containerSize.width - imageSize.width ) / 2;
	const offsetY = ( containerSize.height - imageSize.height ) / 2;
	const left = offsetX + cropRect.x * imageSize.width;
	const top = offsetY + cropRect.y * imageSize.height;
	const width = cropRect.width * imageSize.width;
	const height = cropRect.height * imageSize.height;

	/**
	 * Start a resize drag on a handle.
	 */
	const handleMouseDown = useCallback(
		( handle: HandlePosition, event: React.MouseEvent ) => {
			event.preventDefault();
			event.stopPropagation();
			setDragState( {
				handle,
				startX: event.clientX,
				startY: event.clientY,
				startRect: { ...cropRect },
			} );
		},
		[ cropRect ]
	);

	/**
	 * Compute the new crop rect based on the drag delta and handle position.
	 *
	 * Each handle anchors the opposite edge(s) and only moves the dragged
	 * edge(s). Edges are clamped to [0, 1] so dragging outside the image
	 * boundary is a no-op — the crop never moves or resizes beyond bounds.
	 */
	const computeNewRect = useCallback(
		(
			drag: DragState,
			clientX: number,
			clientY: number
		): NormalizedRect => {
			const dx =
				imageSize.width > 0
					? ( clientX - drag.startX ) / imageSize.width
					: 0;
			const dy =
				imageSize.height > 0
					? ( clientY - drag.startY ) / imageSize.height
					: 0;

			const s = drag.startRect;
			const handle = drag.handle;
			const minSize = 0.05;

			// Compute the four edges of the start rect.
			let edgeTop = s.y;
			let edgeBottom = s.y + s.height;
			let edgeLeft = s.x;
			let edgeRight = s.x + s.width;

			// Move only the dragged edge(s); opposite edges stay anchored.
			if ( handle === 'n' || handle === 'nw' || handle === 'ne' ) {
				edgeTop = Math.max(
					0,
					Math.min( s.y + dy, edgeBottom - minSize )
				);
			}
			if ( handle === 's' || handle === 'sw' || handle === 'se' ) {
				edgeBottom = Math.max(
					edgeTop + minSize,
					Math.min( s.y + s.height + dy, 1 )
				);
			}
			if ( handle === 'w' || handle === 'nw' || handle === 'sw' ) {
				edgeLeft = Math.max(
					0,
					Math.min( s.x + dx, edgeRight - minSize )
				);
			}
			if ( handle === 'e' || handle === 'ne' || handle === 'se' ) {
				edgeRight = Math.max(
					edgeLeft + minSize,
					Math.min( s.x + s.width + dx, 1 )
				);
			}

			let w = edgeRight - edgeLeft;
			let h = edgeBottom - edgeTop;

			// Apply aspect ratio constraint if specified.
			if ( aspectRatio && aspectRatio > 0 ) {
				const currentRatio = w / h;
				if ( currentRatio > aspectRatio ) {
					w = h * aspectRatio;
				} else {
					h = w / aspectRatio;
				}
			}

			return { x: edgeLeft, y: edgeTop, width: w, height: h };
		},
		[ imageSize.width, imageSize.height, aspectRatio ]
	);

	useEffect( () => {
		if ( ! dragState ) {
			return;
		}

		const handleMouseMove = ( event: MouseEvent ) => {
			const newRect = computeNewRect(
				dragState,
				event.clientX,
				event.clientY
			);
			onCropChange( newRect );
		};

		const handleMouseUp = () => {
			setDragState( null );
		};

		document.addEventListener( 'mousemove', handleMouseMove );
		document.addEventListener( 'mouseup', handleMouseUp );

		return () => {
			document.removeEventListener( 'mousemove', handleMouseMove );
			document.removeEventListener( 'mouseup', handleMouseUp );
		};
	}, [ dragState, computeNewRect, onCropChange ] );

	if ( containerSize.width === 0 || containerSize.height === 0 ) {
		return null;
	}

	return (
		<div
			className="wp-image-cropper-next__stencil"
			style={ {
				left,
				top,
				width,
				height,
			} }
		>
			{ /* The crop rectangle border */ }
			<div
				className="wp-image-cropper-next__stencil-rect"
				style={ {
					width: '100%',
					height: '100%',
					top: 0,
					left: 0,
				} }
			/>
			{ /* Resize handles */ }
			{ HANDLE_POSITIONS.map( ( pos ) => (
				// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- resize handles need mouse events.
				<div
					key={ pos }
					className={ `wp-image-cropper-next__handle wp-image-cropper-next__handle--${ pos }` }
					onMouseDown={ ( event ) => handleMouseDown( pos, event ) }
					role="separator"
					aria-orientation={
						pos === 'n' || pos === 's' ? 'horizontal' : 'vertical'
					}
					tabIndex={ 0 }
				/>
			) ) }
		</div>
	);
}
