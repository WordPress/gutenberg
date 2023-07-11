/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
import {
	ResizableBox,
	__unstableMotion as motion,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

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
const FRAME_MIN_WIDTH = 340;
// The reference width of the frame (in px) used to calculate the aspect ratio.
const FRAME_REFERENCE_WIDTH = 1300;
// 9 : 19.5 is the target aspect ratio enforced (when possible) while resizing.
const FRAME_TARGET_ASPECT_RATIO = 9 / 19.5;
// The minimum distance (in px) between the frame resize handle and the
// viewport's edge. If the frame is resized to be closer to the viewport's edge
// than this distance, then "canvas mode" will be enabled.
const SNAP_TO_EDIT_CANVAS_MODE_THRESHOLD = 200;

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
	isReady,
	children,
	oversizedClassName,
	innerContentStyle,
} ) {
	const [ frameSize, setFrameSize ] = useState( {
		width: '100%',
		height: '100%',
	} );
	// The width of the resizable frame when a new resize gesture starts.
	const [ startingWidth, setStartingWidth ] = useState();
	const [ isResizing, setIsResizing ] = useState( false );
	const [ isHovering, setIsHovering ] = useState( false );
	const [ isOversized, setIsOversized ] = useState( false );
	const [ resizeRatio, setResizeRatio ] = useState( 1 );
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const initialAspectRatioRef = useRef( null );
	// The width of the resizable frame on initial render.
	const initialComputedWidthRef = useRef( null );
	const FRAME_TRANSITION = { type: 'tween', duration: isResizing ? 0 : 0.5 };
	const frameRef = useRef( null );

	// Remember frame dimensions on initial render.
	useEffect( () => {
		const { offsetWidth, offsetHeight } = frameRef.current.resizable;
		initialComputedWidthRef.current = offsetWidth;
		initialAspectRatioRef.current = offsetWidth / offsetHeight;
	}, [] );

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
				: ( initialComputedWidthRef.current - startingWidth ) / 2;
		const deltaToDouble = Math.min( deltaAbs, maxDoubledDelta );
		const doubleSegment = deltaAbs === 0 ? 0 : deltaToDouble / deltaAbs;
		const singleSegment = 1 - doubleSegment;

		setResizeRatio( singleSegment + doubleSegment * 2 );

		const updatedWidth = startingWidth + delta.width;

		setIsOversized( updatedWidth > initialComputedWidthRef.current );

		// Width will be controlled by the library (via `resizeRatio`),
		// so we only need to update the height.
		setFrameSize( {
			height: isOversized
				? '100%'
				: calculateNewHeight(
						updatedWidth,
						initialAspectRatioRef.current
				  ),
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
			setFrameSize( { width: '100%', height: '100%' } );
		} else {
			// Trigger full screen if the frame is resized far enough to the left.
			setCanvasMode( 'edit' );
		}
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
		default: {
			opacity: 1,
			left: -16,
		},
		resizing: {
			opacity: 1,
			left: -16,
			scaleY: 1.3,
		},
	};

	return (
		<ResizableBox
			as={ motion.div }
			ref={ frameRef }
			initial={ false }
			variants={ frameAnimationVariants }
			animate={ isFullWidth ? 'fullWidth' : 'default' }
			onAnimationComplete={ ( definition ) => {
				if ( definition === 'fullWidth' )
					setFrameSize( { width: '100%', height: '100%' } );
			} }
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
			maxHeight={ '100%' }
			onMouseOver={ () => setIsHovering( true ) }
			onMouseOut={ () => setIsHovering( false ) }
			handleComponent={ {
				left:
					isHovering || isResizing ? (
						<motion.div
							key="handle"
							className="edit-site-resizable-frame__handle"
							variants={ resizeHandleVariants }
							animate={ isResizing ? 'resizing' : 'default' }
							title="Drag to resize"
							initial={ {
								opacity: 0,
								left: 0,
							} }
							exit={ {
								opacity: 0,
								left: 0,
							} }
							whileHover={ { scaleY: 1.3 } }
						/>
					) : null,
			} }
			onResizeStart={ handleResizeStart }
			onResize={ handleResize }
			onResizeStop={ handleResizeStop }
			className={ classnames( 'edit-site-resizable-frame__inner', {
				'is-resizing': isResizing,
				[ oversizedClassName ]: isOversized,
			} ) }
		>
			<motion.div
				className="edit-site-resizable-frame__inner-content"
				animate={ {
					borderRadius: isFullWidth ? 0 : 8,
				} }
				transition={ FRAME_TRANSITION }
				style={ innerContentStyle }
			>
				{ children }
			</motion.div>
		</ResizableBox>
	);
}

export default ResizableFrame;
