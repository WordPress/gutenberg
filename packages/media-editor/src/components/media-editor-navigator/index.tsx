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

/**
 * Returns CSS position/size style for the viewport rect indicator
 * within the navigator thumbnail.
 *
 * @param vpZoom            Current viewport zoom level (> 1 = zoomed in).
 * @param vpPan             Current viewport pan offset in canvas CSS pixels.
 * @param vpPan.x           Pan offset on the X axis.
 * @param vpPan.y           Pan offset on the Y axis.
 * @param thumbSize         Navigator thumbnail dimensions in pixels.
 * @param thumbSize.width   Thumbnail width.
 * @param thumbSize.height  Thumbnail height.
 * @param canvasSize        Estimated canvas dimensions in pixels.
 * @param canvasSize.width  Canvas width.
 * @param canvasSize.height Canvas height.
 * @return Inline style for the viewport rect overlay element.
 */
function getViewportRectStyle(
	vpZoom: number,
	vpPan: { x: number; y: number },
	thumbSize: { width: number; height: number },
	canvasSize: { width: number; height: number }
): React.CSSProperties {
	if ( canvasSize.width === 0 || canvasSize.height === 0 ) {
		return {};
	}

	// At viewport zoom `vz`, the visible canvas region is (W/vz) × (H/vz).
	const visibleW = canvasSize.width / vpZoom;
	const visibleH = canvasSize.height / vpZoom;

	// Viewport pan shifts the canvas; visible region top-left in canvas pixels:
	const visibleX = canvasSize.width / 2 - visibleW / 2 - vpPan.x / vpZoom;
	const visibleY = canvasSize.height / 2 - visibleH / 2 - vpPan.y / vpZoom;

	// Map canvas coords to thumbnail coords.
	const scaleX = thumbSize.width / canvasSize.width;
	const scaleY = thumbSize.height / canvasSize.height;

	const left = Math.max( 0, visibleX * scaleX );
	const top = Math.max( 0, visibleY * scaleY );
	const width = Math.min( thumbSize.width - left, visibleW * scaleX );
	const height = Math.min( thumbSize.height - top, visibleH * scaleY );

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
	const { viewport, setViewportZoom, setViewportPan } = useViewport();
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

	// Estimate canvas size from the image aspect ratio fitted into the thumbnail.
	const naturalW = state.image?.naturalWidth ?? 1;
	const naturalH = state.image?.naturalHeight ?? 1;
	const canvasSize = useMemo( () => {
		if ( thumbSize.width === 0 || thumbSize.height === 0 ) {
			return { width: naturalW, height: naturalH };
		}
		const ratio = naturalW / naturalH;
		const thumbRatio = thumbSize.width / thumbSize.height;
		if ( ratio > thumbRatio ) {
			return {
				width: thumbSize.width,
				height: thumbSize.width / ratio,
			};
		}
		return {
			width: thumbSize.height * ratio,
			height: thumbSize.height,
		};
	}, [ naturalW, naturalH, thumbSize ] );

	const viewportRectStyle = useMemo(
		() =>
			getViewportRectStyle(
				viewport.zoom,
				viewport.pan,
				thumbSize,
				canvasSize
			),
		[ viewport.zoom, viewport.pan, thumbSize, canvasSize ]
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
			if ( ! drag || thumbSize.width === 0 ) {
				return;
			}
			// Thumbnail scale: thumb px → canvas px. Dragging left in the
			// thumbnail pans the viewport left (negate the delta).
			const scaleX = canvasSize.width / thumbSize.width;
			const scaleY = canvasSize.height / thumbSize.height;
			setViewportPan( {
				x: drag.startPanX - ( e.clientX - drag.startX ) * scaleX,
				y: drag.startPanY - ( e.clientY - drag.startY ) * scaleY,
			} );
		},
		[ canvasSize, thumbSize, setViewportPan ]
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
					setViewportZoom( typeof value === 'number' ? value : 1 );
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
