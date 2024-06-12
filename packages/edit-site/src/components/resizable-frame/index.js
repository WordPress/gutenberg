/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import {
	ResizableBox,
	Tooltip,
	__unstableMotion as motion,
} from '@wordpress/components';
import { useInstanceId, useReducedMotion } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

// Removes the inline styles in the drag handles.
const HANDLE_STYLES_OVERRIDE = {
	position: undefined,
	userSelect: undefined,
	cursor: undefined,
	width: undefined,
	height: undefined,
	top: undefined,
	right: undefined,
	bottom: undefined,
	left: undefined,
};

// The minimum width of the frame (in px) while resizing.
const FRAME_MIN_WIDTH = 320;
// The reference width of the frame (in px) used to calculate the aspect ratio.
const FRAME_REFERENCE_WIDTH = 1300;
// 9 : 19.5 is the target aspect ratio enforced (when possible) while resizing.
const FRAME_TARGET_ASPECT_RATIO = 9 / 19.5;
// The minimum distance (in px) between the frame resize handle and the
// viewport's edge. If the frame is resized to be closer to the viewport's edge
// than this distance, then "canvas mode" will be enabled.
const SNAP_TO_EDIT_CANVAS_MODE_THRESHOLD = 200;
// Default size for the `frameSize` state.
const INITIAL_FRAME_SIZE = { width: '100%', height: '100%' };

function calculateNewHeight( width, initialAspectRatio ) {
	const lerp = ( a, b, amount ) => {
		return a + ( b - a ) * amount;
	};

	// Calculate the intermediate aspect ratio based on the current width.
	const lerpFactor =
		1 -
		Math.max(
			0,
			Math.min(
				1,
				( width - FRAME_MIN_WIDTH ) /
					( FRAME_REFERENCE_WIDTH - FRAME_MIN_WIDTH )
			)
		);

	// Calculate the height based on the intermediate aspect ratio
	// ensuring the frame arrives at the target aspect ratio.
	const intermediateAspectRatio = lerp(
		initialAspectRatio,
		FRAME_TARGET_ASPECT_RATIO,
		lerpFactor
	);

	return width / intermediateAspectRatio;
}

function ResizableFrame( {
	isFullWidth,
	isOversized,
	setIsOversized,
	isReady,
	children,
	/** The default (unresized) width/height of the frame, based on the space availalbe in the viewport. */
	defaultSize,
	innerContentStyle,
} ) {
	const disableMotion = useReducedMotion();
	const [ frameSize, setFrameSize ] = useState( INITIAL_FRAME_SIZE );
	// The width of the resizable frame when a new resize gesture starts.
	const [ startingWidth, setStartingWidth ] = useState();
	const [ isResizing, setIsResizing ] = useState( false );
	const [ shouldShowHandle, setShouldShowHandle ] = useState( false );
	const [ resizeRatio, setResizeRatio ] = useState( 1 );
	const canvasMode = useSelect(
		( select ) => unlock( select( editSiteStore ) ).getCanvasMode(),
		[]
	);
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const FRAME_TRANSITION = { type: 'tween', duration: isResizing ? 0 : 0.5 };
	const frameRef = useRef( null );
	const resizableHandleHelpId = useInstanceId(
		ResizableFrame,
		'edit-site-resizable-frame-handle-help'
	);
	const defaultAspectRatio = defaultSize.width / defaultSize.height;

	const handleResizeStart = ( _event, _direction, ref ) => {
		// Remember the starting width so we don't have to get `ref.offsetWidth` on
		// every resize event thereafter, which will cause layout thrashing.
		setStartingWidth( ref.offsetWidth );
		setIsResizing( true );
	};

	// Calculate the frame size based on the window width as its resized.
	const handleResize = ( _event, _direction, _ref, delta ) => {
		const normalizedDelta = delta.width / resizeRatio;
		const deltaAbs = Math.abs( normalizedDelta );
		const maxDoubledDelta =
			delta.width < 0 // is shrinking
				? deltaAbs
				: ( defaultSize.width - startingWidth ) / 2;
		const deltaToDouble = Math.min( deltaAbs, maxDoubledDelta );
		const doubleSegment = deltaAbs === 0 ? 0 : deltaToDouble / deltaAbs;
		const singleSegment = 1 - doubleSegment;

		setResizeRatio( singleSegment + doubleSegment * 2 );

		const updatedWidth = startingWidth + delta.width;

		setIsOversized( updatedWidth > defaultSize.width );

		// Width will be controlled by the library (via `resizeRatio`),
		// so we only need to update the height.
		setFrameSize( {
			height: isOversized
				? '100%'
				: calculateNewHeight( updatedWidth, defaultAspectRatio ),
		} );
	};

	const handleResizeStop = ( _event, _direction, ref ) => {
		setIsResizing( false );

		if ( ! isOversized ) {
			return;
		}

		setIsOversized( false );

		const remainingWidth =
			ref.ownerDocument.documentElement.offsetWidth - ref.offsetWidth;

		if ( remainingWidth > SNAP_TO_EDIT_CANVAS_MODE_THRESHOLD ) {
			// Reset the initial aspect ratio if the frame is resized slightly
			// above the sidebar but not far enough to trigger full screen.
			setFrameSize( INITIAL_FRAME_SIZE );
		} else {
			// Trigger full screen if the frame is resized far enough to the left.
			setCanvasMode( 'edit' );
		}
	};

	// Handle resize by arrow keys
	const handleResizableHandleKeyDown = ( event ) => {
		if ( ! [ 'ArrowLeft', 'ArrowRight' ].includes( event.key ) ) {
			return;
		}

		event.preventDefault();

		const step = 20 * ( event.shiftKey ? 5 : 1 );
		const delta = step * ( event.key === 'ArrowLeft' ? 1 : -1 );
		const newWidth = Math.min(
			Math.max(
				FRAME_MIN_WIDTH,
				frameRef.current.resizable.offsetWidth + delta
			),
			defaultSize.width
		);

		setFrameSize( {
			width: newWidth,
			height: calculateNewHeight( newWidth, defaultAspectRatio ),
		} );
	};

	const frameAnimationVariants = {
		default: {
			flexGrow: 0,
			height: frameSize.height,
		},
		fullWidth: {
			flexGrow: 1,
			height: frameSize.height,
		},
	};

	const resizeHandleVariants = {
		hidden: {
			opacity: 0,
			left: 0,
		},
		visible: {
			opacity: 1,
			left: -14, // Account for the handle's width.
		},
		active: {
			opacity: 1,
			left: -14, // Account for the handle's width.
			scaleY: 1.3,
		},
	};
	const currentResizeHandleVariant = ( () => {
		if ( isResizing ) {
			return 'active';
		}
		return shouldShowHandle ? 'visible' : 'hidden';
	} )();

	return (
		<ResizableBox
			as={ motion.div }
			ref={ frameRef }
			initial={ false }
			variants={ frameAnimationVariants }
			animate={ isFullWidth ? 'fullWidth' : 'default' }
			onAnimationComplete={ ( definition ) => {
				if ( definition === 'fullWidth' ) {
					setFrameSize( { width: '100%', height: '100%' } );
				}
			} }
			whileHover={
				canvasMode === 'view'
					? {
							scale: 1.005,
							transition: {
								duration: disableMotion ? 0 : 0.5,
								ease: 'easeOut',
							},
					  }
					: {}
			}
			transition={ FRAME_TRANSITION }
			size={ frameSize }
			enable={ {
				top: false,
				right: false,
				bottom: false,
				// Resizing will be disabled until the editor content is loaded.
				left: isReady,
				topRight: false,
				bottomRight: false,
				bottomLeft: false,
				topLeft: false,
			} }
			resizeRatio={ resizeRatio }
			handleClasses={ undefined }
			handleStyles={ {
				left: HANDLE_STYLES_OVERRIDE,
				right: HANDLE_STYLES_OVERRIDE,
			} }
			minWidth={ FRAME_MIN_WIDTH }
			maxWidth={ isFullWidth ? '100%' : '150%' }
			maxHeight="100%"
			onFocus={ () => setShouldShowHandle( true ) }
			onBlur={ () => setShouldShowHandle( false ) }
			onMouseOver={ () => setShouldShowHandle( true ) }
			onMouseOut={ () => setShouldShowHandle( false ) }
			handleComponent={ {
				left: canvasMode === 'view' && (
					<>
						<Tooltip text={ __( 'Drag to resize' ) }>
							{ /* Disable reason: role="separator" does in fact support aria-valuenow */ }
							{ /* eslint-disable-next-line jsx-a11y/role-supports-aria-props */ }
							<motion.button
								key="handle"
								role="separator"
								aria-orientation="vertical"
								className={ clsx(
									'edit-site-resizable-frame__handle',
									{ 'is-resizing': isResizing }
								) }
								variants={ resizeHandleVariants }
								animate={ currentResizeHandleVariant }
								aria-label={ __( 'Drag to resize' ) }
								aria-describedby={ resizableHandleHelpId }
								aria-valuenow={
									frameRef.current?.resizable?.offsetWidth ||
									undefined
								}
								aria-valuemin={ FRAME_MIN_WIDTH }
								aria-valuemax={ defaultSize.width }
								onKeyDown={ handleResizableHandleKeyDown }
								initial="hidden"
								exit="hidden"
								whileFocus="active"
								whileHover="active"
							/>
						</Tooltip>
						<div hidden id={ resizableHandleHelpId }>
							{ __(
								'Use left and right arrow keys to resize the canvas. Hold shift to resize in larger increments.'
							) }
						</div>
					</>
				),
			} }
			onResizeStart={ handleResizeStart }
			onResize={ handleResize }
			onResizeStop={ handleResizeStop }
			className={ clsx( 'edit-site-resizable-frame__inner', {
				'is-resizing': isResizing,
			} ) }
			showHandle={ false } // Do not show the default handle, as we're using a custom one.
		>
			<div
				className="edit-site-resizable-frame__inner-content"
				style={ innerContentStyle }
			>
				{ children }
			</div>
		</ResizableBox>
	);
}

export default ResizableFrame;
