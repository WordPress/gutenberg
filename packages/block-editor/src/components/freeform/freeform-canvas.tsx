import clsx from 'clsx';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { DEFAULT_CANVAS_HEIGHT } from './constants';
import {
	toDesignUnits,
	toOverlayPx,
	useCanvasGeometry,
} from './use-canvas-geometry';
import {
	getBirthPlacement,
	getRequiredCanvasHeight,
	isPlaced,
	readRects,
} from './rects';
import {
	BASE_MESH,
	constrainRect,
	getDistanceLabels,
	resolveDragPosition,
	resolveResize,
} from './snapping';
import { getCanvasConversion, measureSection } from './conversion';

/**
 * How far the pointer has to travel before a press becomes a drag. Below this a
 * press is a click, and a block whose grip was merely clicked must not move.
 */
const DRAG_THRESHOLD = 3;

/**
 * The resize handles, in the order they are drawn.
 */
const HANDLES = [ 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w' ];

function mergeChildLayout( style, layout ) {
	return {
		...style,
		layout: { ...style?.layout, ...layout },
	};
}

/**
 * The editing surface for a freeform canvas: the grips that move blocks, the
 * handles that resize them, and the guides and measurements that say what the
 * magnets are doing.
 *
 * @param {Object}   props
 * @param {string}   props.canvasClientId    The section acting as the canvas.
 * @param {string[]} props.selectedClientIds The selected blocks within it.
 * @param {boolean}  props.isCanvas          Whether the section has already
 *                                           been converted to a canvas.
 */
export default function FreeformCanvas( {
	canvasClientId,
	selectedClientIds,
	isCanvas,
} ) {
	const canvasElement = useBlockElement( canvasClientId );
	const [ overlayElement, setOverlayElement ] = useState( null );
	const geometry = useCanvasGeometry( canvasElement, overlayElement );

	const { childClientIds, childStyles, canvasLayout } = useSelect(
		( select ) => {
			const { getBlockOrder, getBlockAttributes, getBlockStyles } =
				unlock( select( blockEditorStore ) );
			const order = getBlockOrder( canvasClientId );
			return {
				childClientIds: order,
				childStyles: getBlockStyles( order ),
				canvasLayout: getBlockAttributes( canvasClientId )?.layout,
			};
		},
		[ canvasClientId ]
	);

	const {
		updateBlockAttributes,
		duplicateBlocks,
		__unstableMarkNextChangeAsNotPersistent,
		__unstableMarkLastChangeAsPersistent,
	} = useDispatch( blockEditorStore );

	// Set the moment a section is converted, so the stylesheet below is correct
	// immediately rather than after the store has made its way back through a
	// render that, for a section with a selected child, never comes.
	const [ converted, setConverted ] = useState( null );
	const isLive = isCanvas || !! converted;

	const canvasHeight =
		canvasLayout?.canvasHeight ??
		converted?.canvasHeight ??
		DEFAULT_CANVAS_HEIGHT;

	const rects = useMemo( () => {
		if ( ! geometry ) {
			return {};
		}
		return readRects( {
			canvasElement,
			childClientIds,
			childStyles,
			designToCanvasPx: geometry.designToCanvasPx,
		} );
	}, [ canvasElement, childClientIds, childStyles, geometry ] );

	// A block inserted into the canvas has no coordinates yet, so without this
	// every new block would stack at the origin. They are born at the content
	// margin, below whatever is already there.
	useEffect( () => {
		// Before a section is a canvas every block in it is "unplaced", and
		// placing them would throw away the layout the conversion preserves.
		if ( ! isLive ) {
			return;
		}
		const unplaced = childClientIds.filter(
			( clientId ) => ! isPlaced( childStyles[ clientId ]?.layout )
		);
		if ( ! unplaced.length || ! Object.keys( rects ).length ) {
			return;
		}

		const placedRects = childClientIds
			.filter( ( clientId ) =>
				isPlaced( childStyles[ clientId ]?.layout )
			)
			.map( ( clientId ) => rects[ clientId ] )
			.filter( Boolean );

		const updates = {};
		const running = [ ...placedRects ];
		for ( const clientId of unplaced ) {
			const placement = getBirthPlacement( running );
			updates[ clientId ] = {
				style: mergeChildLayout( childStyles[ clientId ], placement ),
			};
			running.push( {
				...placement,
				height: rects[ clientId ]?.height ?? 0,
			} );
		}

		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( Object.keys( updates ), updates, true );
	}, [
		isLive,
		childClientIds,
		childStyles,
		rects,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	// Everything a live gesture needs, kept out of state so that a pointermove
	// does not re-render the whole canvas to read it back.
	const gestureRef = useRef( null );
	// What the gesture is currently claiming, which is what gets drawn.
	const [ feedback, setFeedback ] = useState( null );

	// The block toolbar overlaps whatever is being moved, so the editor is told
	// a gesture is live and gets it out of the way.
	useEffect( () => {
		const className = 'is-freeform-canvas-gesturing';
		document.body.classList.toggle( className, !! feedback );
		return () => document.body.classList.remove( className );
	}, [ feedback ] );

	// The canvas paints its own lattice, because it has to sit *under* the
	// blocks: a tint and gutters drawn over the content would wash the text
	// out. That puts it inside the editor's iframe rather than in this
	// overlay, so the canvas element is told when a gesture is live.
	useEffect( () => {
		const className = 'is-freeform-gesturing';
		if ( ! canvasElement ) {
			return;
		}
		canvasElement.classList.toggle( className, !! feedback );
		return () => canvasElement.classList.remove( className );
	}, [ canvasElement, feedback ] );

	// A gesture writes every frame, and the store already folds consecutive
	// updates of the same attribute on the same blocks into one undo step, so
	// these are plain persistent writes. Marking them not-persistent instead
	// would merge the whole drag into whatever undo level came *before* it,
	// and undoing would jump back past the drag to some earlier edit.
	const writeLayouts = useCallback(
		( updates ) => {
			updateBlockAttributes( Object.keys( updates ), updates, true );
		},
		[ updateBlockAttributes ]
	);

	const growCanvasToFit = useCallback(
		( movedRects ) => {
			const everyRect = [
				...Object.entries( rects )
					.filter( ( [ clientId ] ) => ! movedRects[ clientId ] )
					.map( ( [ , rect ] ) => rect ),
				...Object.values( movedRects ),
			];
			const required = getRequiredCanvasHeight( everyRect, canvasHeight );
			if ( required > canvasHeight ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( canvasClientId, {
					layout: { ...canvasLayout, canvasHeight: required },
				} );
			}
		},
		[
			rects,
			canvasHeight,
			canvasLayout,
			canvasClientId,
			updateBlockAttributes,
			__unstableMarkNextChangeAsNotPersistent,
		]
	);

	const endGesture = useCallback( () => {
		const gesture = gestureRef.current;
		gestureRef.current = null;
		setFeedback( null );
		if ( ! gesture || ! gesture.hasMoved ) {
			return;
		}

		growCanvasToFit( gesture.lastRects );
	}, [ growCanvasToFit ] );

	const applyDrag = useCallback(
		( event ) => {
			const gesture = gestureRef.current;
			if ( ! gesture || gesture.kind !== 'drag' ) {
				return;
			}

			let deltaX = event.clientX - gesture.pointerX;
			let deltaY = event.clientY - gesture.pointerY;

			if (
				! gesture.hasMoved &&
				Math.abs( deltaX ) < DRAG_THRESHOLD &&
				Math.abs( deltaY ) < DRAG_THRESHOLD
			) {
				return;
			}
			gesture.hasMoved = true;

			// Shift locks the drag to whichever axis the hand has committed to.
			let lockedAxis = null;
			if ( event.shiftKey ) {
				if ( Math.abs( deltaX ) > Math.abs( deltaY ) ) {
					deltaY = 0;
					lockedAxis = 'y';
				} else {
					deltaX = 0;
					lockedAxis = 'x';
				}
			}

			gesture.movedX ||= Math.abs( deltaX ) > DRAG_THRESHOLD;
			gesture.movedY ||= Math.abs( deltaY ) > DRAG_THRESHOLD;

			const unitsX = toDesignUnits( deltaX, gesture.geometry );
			const unitsY = toDesignUnits( deltaY, gesture.geometry );

			const leadRect = gesture.startRects[ gesture.leadClientId ];
			const resolved = resolveDragPosition( {
				rect: leadRect,
				others: gesture.otherRects,
				canvasHeight: gesture.canvasHeight,
				rawX: leadRect.x + unitsX,
				rawY: leadRect.y + unitsY,
				movedX: gesture.movedX,
				movedY: gesture.movedY,
				lockedAxis,
				freeform: event.metaKey || event.ctrlKey,
				// The lattice is painted for the whole gesture, so its lines
				// are honest magnets for the whole gesture.
				lattice: true,
			} );

			// The whole selection travels by the same amount the lead block
			// did, so a group keeps its own shape while snapping as one thing.
			const shiftX = resolved.x - leadRect.x;
			const shiftY = resolved.y - leadRect.y;

			const updates = {};
			const movedRects = {};
			for ( const clientId of gesture.clientIds ) {
				const startRect = gesture.startRects[ clientId ];
				const moved = constrainRect( {
					...startRect,
					x: startRect.x + shiftX,
					y: startRect.y + shiftY,
				} );
				movedRects[ clientId ] = moved;
				updates[ clientId ] = {
					style: mergeChildLayout( gesture.startStyles[ clientId ], {
						x: moved.x,
						y: moved.y,
					} ),
				};
			}

			gesture.lastUpdates = updates;
			gesture.lastRects = movedRects;
			writeLayouts( updates );

			setFeedback( {
				kind: 'drag',
				guideX: resolved.guideX,
				guideY: resolved.guideY,
				// Measurements are power-user furniture: they appear while Alt
				// is held, or when a spacing magnet is actually holding — never
				// by default. Nothing on screen until something is true.
				labels:
					event.altKey ||
					resolved.equalX ||
					resolved.equalY ||
					resolved.repeatX ||
					resolved.repeatY ||
					resolved.rhythmX ||
					resolved.rhythmY
						? getDistanceLabels( {
								rect: movedRects[ gesture.leadClientId ],
								others: gesture.otherRects,
								canvasHeight: gesture.canvasHeight,
								isEqualX:
									resolved.equalX ||
									!! resolved.repeatX ||
									!! resolved.rhythmX,
								isEqualY:
									resolved.equalY ||
									!! resolved.repeatY ||
									!! resolved.rhythmY,
								guideX: resolved.guideX,
								guideY: resolved.guideY,
							} )
						: [],
			} );
		},
		[ writeLayouts ]
	);

	const applyResize = useCallback(
		( event ) => {
			const gesture = gestureRef.current;
			if ( ! gesture || gesture.kind !== 'resize' ) {
				return;
			}

			const deltaX = event.clientX - gesture.pointerX;
			const deltaY = event.clientY - gesture.pointerY;
			if (
				! gesture.hasMoved &&
				Math.abs( deltaX ) < DRAG_THRESHOLD &&
				Math.abs( deltaY ) < DRAG_THRESHOLD
			) {
				return;
			}
			gesture.hasMoved = true;

			const resolved = resolveResize( {
				rect: gesture.startRects[ gesture.leadClientId ],
				direction: gesture.direction,
				others: gesture.otherRects,
				canvasHeight: gesture.canvasHeight,
				deltaX: toDesignUnits( deltaX, gesture.geometry ),
				deltaY: toDesignUnits( deltaY, gesture.geometry ),
				freeform: event.metaKey || event.ctrlKey,
				lattice: true,
			} );

			const updates = {
				[ gesture.leadClientId ]: {
					style: mergeChildLayout(
						gesture.startStyles[ gesture.leadClientId ],
						{
							x: resolved.rect.x,
							y: resolved.rect.y,
							width: resolved.rect.width,
							height: resolved.rect.height,
						}
					),
				},
			};

			gesture.lastUpdates = updates;
			gesture.lastRects = { [ gesture.leadClientId ]: resolved.rect };
			writeLayouts( updates );

			setFeedback( {
				kind: 'resize',
				guideX: resolved.guideX,
				guideY: resolved.guideY,
				sizeLabelX: resolved.sizeLabelX,
				sizeLabelY: resolved.sizeLabelY,
				rect: resolved.rect,
				labels: [],
			} );
		},
		[ writeLayouts ]
	);

	// Measures the section and freezes its current layout as coordinates, so a
	// block can be picked up out of normal flow without the rest of the section
	// collapsing onto the same spot. The rects are kept locally as well as
	// written to the blocks: the stylesheet above uses them straight away.
	const convertSectionToCanvas = useCallback( () => {
		const measured = canvasElement && measureSection( canvasElement );
		const conversion = measured && getCanvasConversion( measured );
		if ( ! conversion ) {
			return null;
		}

		const updates = {};
		const convertedRects = {};
		measured.clientIds.forEach( ( clientId, index ) => {
			const rect = conversion.rects[ index ];
			convertedRects[ clientId ] = rect;
			updates[ clientId ] = {
				style: mergeChildLayout( childStyles[ clientId ], rect ),
			};
		} );

		setConverted( {
			rects: convertedRects,
			canvasHeight: conversion.canvasHeight,
		} );

		updateBlockAttributes( canvasClientId, {
			layout: {
				...canvasLayout,
				type: 'freeform',
				canvasHeight: conversion.canvasHeight,
			},
		} );
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( Object.keys( updates ), updates, true );

		return { rects: convertedRects, canvasHeight: conversion.canvasHeight };
	}, [
		canvasElement,
		canvasClientId,
		canvasLayout,
		childStyles,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	const beginGesture = useCallback(
		( event, { kind, clientIds, leadClientId, direction } ) => {
			if ( ! geometry ) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			try {
				event.target.setPointerCapture( event.pointerId );
			} catch {
				// Pointer capture is a nicety; the document listeners below
				// still see the gesture through to its end without it.
			}

			// The first drag in a section is also what turns it into a canvas.
			const conversion = isLive ? null : convertSectionToCanvas();
			if ( ! isLive && ! conversion ) {
				return;
			}
			const liveRects = conversion ? conversion.rects : rects;
			const liveCanvasHeight = conversion
				? conversion.canvasHeight
				: canvasHeight;

			// Close whatever undo level is open before the first frame writes.
			// Without this, dragging the same block twice in a row looks to the
			// store like one long run of same-attribute updates, and both drags
			// collapse into a single undo step.
			__unstableMarkLastChangeAsPersistent();

			// Alt-drag leaves a copy behind and carries the original away, so a
			// layout can be built by repetition without a trip to the toolbar.
			// The copy is a faithful clone, coordinates included, so it lands
			// exactly where the hand picked the original up and nothing has to
			// be written to it. It is deliberately the original that travels:
			// the selection then still points at the block under the pointer,
			// and nothing here has to wait on the duplication to finish.
			if ( kind === 'drag' && event.altKey ) {
				duplicateBlocks( clientIds, false );
			}

			const startRects = {};
			const startStyles = {};
			for ( const clientId of clientIds ) {
				startRects[ clientId ] = liveRects[ clientId ];
				startStyles[ clientId ] = conversion
					? mergeChildLayout(
							childStyles[ clientId ],
							liveRects[ clientId ]
						)
					: childStyles[ clientId ];
			}
			const dragged = clientIds;

			const draggedSet = new Set( dragged );
			gestureRef.current = {
				kind,
				direction,
				clientIds: dragged,
				leadClientId: draggedSet.has( leadClientId )
					? leadClientId
					: dragged[ 0 ],
				pointerX: event.clientX,
				pointerY: event.clientY,
				geometry,
				canvasHeight: liveCanvasHeight,
				startRects,
				startStyles,
				// Blocks travelling with the grabbed one must not act as
				// magnets for it: they are part of the thing being moved.
				otherRects: childClientIds
					.filter(
						( clientId ) =>
							! draggedSet.has( clientId ) &&
							liveRects[ clientId ]
					)
					.map( ( clientId ) => liveRects[ clientId ] ),
				movedX: false,
				movedY: false,
				hasMoved: false,
				lastUpdates: {},
				lastRects: {},
			};
		},
		[
			geometry,
			isLive,
			convertSectionToCanvas,
			canvasHeight,
			childClientIds,
			childStyles,
			rects,
			duplicateBlocks,
			__unstableMarkLastChangeAsPersistent,
		]
	);

	// The gesture is followed on the document so it survives the pointer
	// leaving the handle it started on.
	useEffect( () => {
		const onPointerMove = ( event ) => {
			const gesture = gestureRef.current;
			if ( ! gesture ) {
				return;
			}
			if ( gesture.kind === 'drag' ) {
				applyDrag( event );
			} else {
				applyResize( event );
			}
		};
		const onPointerUp = () => endGesture();
		const onKeyDown = ( event ) => {
			if ( gestureRef.current && event.keyCode === ESCAPE ) {
				const gesture = gestureRef.current;
				gestureRef.current = null;
				setFeedback( null );
				// Put everything back where it was found.
				const reverted = {};
				for ( const clientId of gesture.clientIds ) {
					reverted[ clientId ] = {
						style: gesture.startStyles[ clientId ],
					};
				}
				writeLayouts( reverted );
				event.preventDefault();
			}
		};

		document.addEventListener( 'pointermove', onPointerMove );
		document.addEventListener( 'pointerup', onPointerUp );
		document.addEventListener( 'pointercancel', onPointerUp );
		document.addEventListener( 'keydown', onKeyDown );
		return () => {
			document.removeEventListener( 'pointermove', onPointerMove );
			document.removeEventListener( 'pointerup', onPointerUp );
			document.removeEventListener( 'pointercancel', onPointerUp );
			document.removeEventListener( 'keydown', onKeyDown );
		};
	}, [ applyDrag, applyResize, endGesture, writeLayouts ] );

	const nudge = useCallback(
		( event, clientIds ) => {
			const steps = {
				ArrowLeft: [ -1, 0 ],
				ArrowRight: [ 1, 0 ],
				ArrowUp: [ 0, -1 ],
				ArrowDown: [ 0, 1 ],
			};
			const step = steps[ event.key ];
			if ( ! step ) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();

			// A plain arrow moves by the mesh; Shift is the fine adjustment.
			const distance = event.shiftKey ? 1 : BASE_MESH;
			const updates = {};
			const movedRects = {};
			for ( const clientId of clientIds ) {
				const rect = rects[ clientId ];
				if ( ! rect ) {
					continue;
				}
				const moved = constrainRect( {
					...rect,
					x: rect.x + step[ 0 ] * distance,
					y: rect.y + step[ 1 ] * distance,
				} );
				movedRects[ clientId ] = moved;
				updates[ clientId ] = {
					style: mergeChildLayout( childStyles[ clientId ], {
						x: moved.x,
						y: moved.y,
					} ),
				};
			}
			if ( Object.keys( updates ).length ) {
				writeLayouts( updates );
				growCanvasToFit( movedRects );
			}
		},
		[ rects, childStyles, writeLayouts, growCanvasToFit ]
	);

	if ( ! canvasElement ) {
		return null;
	}

	const placedSelection = selectedClientIds.filter(
		( clientId ) => rects[ clientId ]
	);
	const leadClientId = placedSelection[ 0 ];
	const isGesturing = !! feedback;

	return (
		<BlockPopoverCover
			className={ clsx( 'block-editor-freeform-canvas', {
				'is-gesturing': isGesturing,
			} ) }
			clientId={ canvasClientId }
			__unstablePopoverSlot="__unstable-block-tools-after"
		>
			<div
				ref={ setOverlayElement }
				className="block-editor-freeform-canvas__surface"
			>
				{ geometry && (
					<>
						{ placedSelection.map( ( clientId ) => (
							<FreeformItem
								key={ clientId }
								clientId={ clientId }
								rect={ rects[ clientId ] }
								geometry={ geometry }
								isLead={ clientId === leadClientId }
								showHandles={ placedSelection.length === 1 }
								onGripPointerDown={ ( event ) =>
									beginGesture( event, {
										kind: 'drag',
										clientIds: placedSelection,
										leadClientId: clientId,
									} )
								}
								onHandlePointerDown={ ( event, direction ) =>
									beginGesture( event, {
										kind: 'resize',
										clientIds: [ clientId ],
										leadClientId: clientId,
										direction,
									} )
								}
								onGripKeyDown={ ( event ) =>
									nudge( event, placedSelection )
								}
							/>
						) ) }
						{ feedback && (
							<FreeformFeedback
								feedback={ feedback }
								geometry={ geometry }
							/>
						) }
					</>
				) }
			</div>
		</BlockPopoverCover>
	);
}

function FreeformItem( {
	rect,
	geometry,
	isLead,
	showHandles,
	onGripPointerDown,
	onHandlePointerDown,
	onGripKeyDown,
} ) {
	// The canvas keeps the design aspect ratio, so one design unit is the same
	// number of pixels on both axes and a single conversion covers the lot.
	const style = {
		left: toOverlayPx( rect.x, geometry ),
		top: toOverlayPx( rect.y, geometry ),
		width: toOverlayPx( rect.width, geometry ),
		height: toOverlayPx( rect.height, geometry ),
	};

	return (
		<div
			className={ clsx( 'block-editor-freeform-canvas__item', {
				'is-lead': isLead,
			} ) }
			style={ style }
		>
			<button
				type="button"
				className="block-editor-freeform-canvas__grip"
				onPointerDown={ onGripPointerDown }
				onKeyDown={ onGripKeyDown }
				aria-label={ __( 'Move block on the canvas' ) }
			>
				<span aria-hidden="true" />
			</button>
			{ showHandles &&
				HANDLES.map( ( direction ) => (
					<button
						type="button"
						key={ direction }
						className={ `block-editor-freeform-canvas__handle is-${ direction }` }
						onPointerDown={ ( event ) =>
							onHandlePointerDown( event, direction )
						}
						aria-label={ sprintf(
							// translators: %s: a resize direction, such as "north west".
							__( 'Resize block (%s)' ),
							RESIZE_HANDLE_LABELS[ direction ]
						) }
					/>
				) ) }
		</div>
	);
}

const RESIZE_HANDLE_LABELS = {
	n: __( 'top' ),
	ne: __( 'top right' ),
	e: __( 'right' ),
	se: __( 'bottom right' ),
	s: __( 'bottom' ),
	sw: __( 'bottom left' ),
	w: __( 'left' ),
	nw: __( 'top left' ),
};

function FreeformFeedback( { feedback, geometry } ) {
	const {
		guideX,
		guideY,
		labels = [],
		sizeLabelX,
		sizeLabelY,
		rect,
	} = feedback;

	return (
		<>
			{ guideX !== null && (
				<div
					className="block-editor-freeform-canvas__guide is-vertical"
					style={ { left: toOverlayPx( guideX, geometry ) } }
				/>
			) }
			{ guideY !== null && (
				<div
					className="block-editor-freeform-canvas__guide is-horizontal"
					style={ { top: toOverlayPx( guideY, geometry ) } }
				/>
			) }
			{ labels.map( ( label, index ) => (
				<div
					key={ index }
					className={ clsx(
						'block-editor-freeform-canvas__measure',
						`is-${ label.axis }`,
						{ 'is-equal': label.isEqual }
					) }
					style={
						label.axis === 'horizontal'
							? {
									left: toOverlayPx( label.start, geometry ),
									top: toOverlayPx( label.at, geometry ),
									width: toOverlayPx(
										label.distance,
										geometry
									),
								}
							: {
									left: toOverlayPx( label.at, geometry ),
									top: toOverlayPx( label.start, geometry ),
									height: toOverlayPx(
										label.distance,
										geometry
									),
								}
					}
				>
					<span>
						{ label.isEqual ? '= ' : '' }
						{ Math.round( label.distance ) }
					</span>
				</div>
			) ) }
			{ ( sizeLabelX || sizeLabelY ) && rect && (
				<div
					className="block-editor-freeform-canvas__size-match"
					style={ {
						left: toOverlayPx( rect.x + rect.width, geometry ),
						top: toOverlayPx( rect.y + rect.height, geometry ),
					} }
				>
					{ sizeLabelX === 'width'
						? __( 'Same width' )
						: __( 'Same height' ) }
				</div>
			) }
		</>
	);
}
