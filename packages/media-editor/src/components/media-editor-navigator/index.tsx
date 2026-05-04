/**
 * WordPress dependencies
 */
import { RangeControl } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import {
	useCallback,
	useRef,
	useState,
	useMemo,
	useEffect,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useCropper } from '../../image-editor';
import { useViewport } from '../../image-editor/react/components/viewport-provider';
import {
	MIN_VIEWPORT_ZOOM,
	MAX_VIEWPORT_ZOOM,
} from '../../image-editor/core/constants';
import { useMediaEditorContext } from '../media-editor-provider';
import './style.scss';

function getViewportRectStyle(
	vpZoom: number,
	vpPan: { x: number; y: number },
	thumbSize: { width: number; height: number },
	actualCanvasSize: { width: number; height: number },
	imageNaturalSize: { width: number; height: number }
): React.CSSProperties {
	if (
		actualCanvasSize.width === 0 ||
		actualCanvasSize.height === 0 ||
		thumbSize.width === 0 ||
		thumbSize.height === 0 ||
		imageNaturalSize.width === 0 ||
		imageNaturalSize.height === 0
	) {
		return {};
	}

	const imageRatio = imageNaturalSize.width / imageNaturalSize.height;
	const canvasRatio = actualCanvasSize.width / actualCanvasSize.height;

	// Image size fitted into canvas space (aspect-ratio preserving).
	let imageInCanvasW: number;
	let imageInCanvasH: number;
	if ( imageRatio > canvasRatio ) {
		imageInCanvasW = actualCanvasSize.width;
		imageInCanvasH = actualCanvasSize.width / imageRatio;
	} else {
		imageInCanvasH = actualCanvasSize.height;
		imageInCanvasW = actualCanvasSize.height * imageRatio;
	}

	// Image size fitted into thumbnail space (same logic — matches the <img>
	// element's object-fit:contain rendering).
	const thumbRatio = thumbSize.width / thumbSize.height;
	let thumbImageW: number;
	let thumbImageH: number;
	if ( imageRatio > thumbRatio ) {
		thumbImageW = thumbSize.width;
		thumbImageH = thumbSize.width / imageRatio;
	} else {
		thumbImageH = thumbSize.height;
		thumbImageW = thumbSize.height * imageRatio;
	}

	// Scale from canvas pixels to thumbnail pixels (via image dimensions).
	const canvasToThumb = thumbImageW / imageInCanvasW;

	// Visible canvas region in canvas pixels.
	const visW = actualCanvasSize.width / vpZoom;
	const visH = actualCanvasSize.height / vpZoom;
	const visLeft = actualCanvasSize.width / 2 - vpPan.x / vpZoom - visW / 2;
	const visTop = actualCanvasSize.height / 2 - vpPan.y / vpZoom - visH / 2;

	// Image top-left offset within canvas space.
	const imageLeft = ( actualCanvasSize.width - imageInCanvasW ) / 2;
	const imageTop = ( actualCanvasSize.height - imageInCanvasH ) / 2;

	// Image top-left offset within thumbnail space (letterbox offset).
	const thumbImageLeft = ( thumbSize.width - thumbImageW ) / 2;
	const thumbImageTop = ( thumbSize.height - thumbImageH ) / 2;

	// Map visible canvas region into thumbnail coordinates.
	const rawLeft = thumbImageLeft + ( visLeft - imageLeft ) * canvasToThumb;
	const rawTop = thumbImageTop + ( visTop - imageTop ) * canvasToThumb;
	const rawRight = rawLeft + visW * canvasToThumb;
	const rawBottom = rawTop + visH * canvasToThumb;

	const left = Math.max( 0, Math.min( rawLeft, thumbSize.width ) );
	const top = Math.max( 0, Math.min( rawTop, thumbSize.height ) );
	const width = Math.max( 0, Math.min( rawRight, thumbSize.width ) - left );
	const height = Math.max( 0, Math.min( rawBottom, thumbSize.height ) - top );

	return { left, top, width, height };
}

/**
 * Navigator panel — a Photoshop-style minimap for the image editor viewport.
 *
 * Shows a thumbnail of the source image with a rectangle indicating the
 * currently visible portion of the canvas. Users can drag the thumbnail to
 * pan the viewport, and use the zoom slider to change the viewport zoom
 * without affecting the crop area.
 */
export default function MediaEditorNavigator() {
	const { state } = useCropper();
	const { viewport, setViewportZoomAtCenter, setViewportPan } = useViewport();
	const { media } = useMediaEditorContext();

	const src = media?.source_url ?? state.image?.src ?? '';

	// Thumbnail container ref for measuring its layout size.
	const thumbContainerRef = useRef< HTMLDivElement >( null );
	const [ thumbSize, setThumbSize ] = useState( { width: 0, height: 0 } );

	useEffect( () => {
		const el = thumbContainerRef.current;
		if ( ! el ) {
			return;
		}
		const observer = new ResizeObserver( ( entries ) => {
			for ( const entry of entries ) {
				const { width, height } = entry.contentRect;
				setThumbSize( ( prev ) =>
					prev.width === width && prev.height === height
						? prev
						: { width, height }
				);
			}
		} );
		observer.observe( el );
		return () => {
			observer.disconnect();
		};
	}, [] );

	const naturalW = state.image?.naturalWidth ?? 1;
	const naturalH = state.image?.naturalHeight ?? 1;
	const actualCanvasW = viewport.canvasSize?.width ?? 0;
	const actualCanvasH = viewport.canvasSize?.height ?? 0;

	const viewportRectStyle = useMemo(
		() =>
			getViewportRectStyle(
				viewport.zoom,
				viewport.pan,
				thumbSize,
				{ width: actualCanvasW, height: actualCanvasH },
				{ width: naturalW, height: naturalH }
			),
		[
			viewport.zoom,
			viewport.pan,
			thumbSize,
			actualCanvasW,
			actualCanvasH,
			naturalW,
			naturalH,
		]
	);

	// Drag-to-pan: dragging the thumbnail moves the viewport.
	const dragRef = useRef< {
		startX: number;
		startY: number;
		startPanX: number;
		startPanY: number;
	} | null >( null );

	const handleThumbPointerDown = useCallback(
		( e: React.PointerEvent< HTMLDivElement > ) => {
			e.preventDefault();
			e.currentTarget.setPointerCapture( e.pointerId );
			dragRef.current = {
				startX: e.clientX,
				startY: e.clientY,
				startPanX: viewport.pan.x,
				startPanY: viewport.pan.y,
			};
		},
		[ viewport.pan ]
	);

	const handleThumbPointerMove = useCallback(
		( e: React.PointerEvent< HTMLDivElement > ) => {
			const drag = dragRef.current;
			if ( ! drag || thumbSize.width === 0 || actualCanvasW === 0 ) {
				return;
			}
			// Thumbnail scale: thumb px → canvas px. Dragging left in the
			// thumbnail pans the viewport left (negate the delta).
			const scaleX = actualCanvasW / thumbSize.width;
			const scaleY = actualCanvasH / thumbSize.height;
			setViewportPan( {
				x: drag.startPanX - ( e.clientX - drag.startX ) * scaleX,
				y: drag.startPanY - ( e.clientY - drag.startY ) * scaleY,
			} );
		},
		[ actualCanvasW, actualCanvasH, thumbSize, setViewportPan ]
	);

	const handleThumbPointerUp = useCallback( () => {
		dragRef.current = null;
	}, [] );

	if ( ! src ) {
		return null;
	}

	return (
		<Stack direction="column" gap="sm">
			{ /* Thumbnail with viewport rect overlay */ }
			<div
				ref={ thumbContainerRef }
				className="media-editor-navigator__thumbnail"
				onPointerDown={ handleThumbPointerDown }
				onPointerMove={ handleThumbPointerMove }
				onPointerUp={ handleThumbPointerUp }
				onPointerCancel={ handleThumbPointerUp }
				onLostPointerCapture={ handleThumbPointerUp }
			>
				<img
					className="media-editor-navigator__thumbnail-img"
					src={ src }
					alt=""
					draggable={ false }
				/>
				{ thumbSize.width > 0 && (
					<div
						className="media-editor-navigator__viewport-rect"
						style={ viewportRectStyle }
					/>
				) }
			</div>

			{ /* Viewport zoom slider */ }
			<RangeControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'View zoom' ) }
				min={ MIN_VIEWPORT_ZOOM }
				max={ MAX_VIEWPORT_ZOOM }
				step={ 0.05 }
				value={ viewport.zoom }
				onChange={ ( value ) => {
					setViewportZoomAtCenter(
						typeof value === 'number' ? value : 1
					);
				} }
				renderTooltipContent={ ( value ) => {
					const zoom = typeof value === 'number' ? value : 1;
					return sprintf(
						/* translators: %d: view zoom level as a percentage. */
						__( '%d%%' ),
						Math.round( zoom * 100 )
					);
				} }
			/>
		</Stack>
	);
}
