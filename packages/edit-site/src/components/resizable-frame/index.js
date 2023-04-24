/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import {
	ResizableBox,
	__unstableMotion as motion,
} from '@wordpress/components';

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

const MIN_FRAME_SIZE = 340;
const lerp = ( a, b, amount ) => {
	return a + ( b - a ) * amount;
};

function ResizableFrame( { isFull, children } ) {
	const [ frameSize, setFrameSize ] = useState( {
		width: '100%',
		height: '100%',
	} );
	const [ isResizing, setIsResizing ] = useState( false );
	const [ isHovering, setIsHovering ] = useState( false );

	const initialAspectRatioRef = useRef( null );

	const FRAME_TRANSITION = { type: 'tween', duration: isResizing ? 0 : 0.5 };

	const handleResize = ( event, direction, ref ) => {
		const updatedWidth = ref.offsetWidth;
		const updatedHeight = ref.offsetHeight;

		if ( initialAspectRatioRef.current === null ) {
			initialAspectRatioRef.current = updatedWidth / updatedHeight;
		}

		const lerpFactor =
			1 -
			Math.max(
				0,
				Math.min(
					1,
					( updatedWidth - MIN_FRAME_SIZE ) /
						( 1300 - MIN_FRAME_SIZE )
				)
			);
		const intermediateAspectRatio = lerp(
			initialAspectRatioRef.current,
			9 / 19.5,
			lerpFactor
		);
		const newHeight = updatedWidth / intermediateAspectRatio;
		setFrameSize( { width: updatedWidth, height: newHeight } );
	};

	return (
		<ResizableBox
			as={ motion.div }
			initial={ false }
			animate={ {
				flexGrow: isFull ? 1 : 0,
				height: frameSize.height,
			} }
			transition={ FRAME_TRANSITION }
			size={ frameSize }
			enable={ {
				top: false,
				right: false,
				bottom: false,
				left: true,
				topRight: false,
				bottomRight: false,
				bottomLeft: false,
				topLeft: false,
			} }
			resizeRatio={ 2 }
			handleClasses={ undefined }
			handleStyles={ {
				left: HANDLE_STYLES_OVERRIDE,
				right: HANDLE_STYLES_OVERRIDE,
			} }
			minWidth={ MIN_FRAME_SIZE }
			maxWidth={ '100%' }
			maxHeight={ '100%' }
			onMouseOver={ () => setIsHovering( true ) }
			onMouseOut={ () => setIsHovering( false ) }
			handleComponent={ {
				left: ! isHovering ? null : (
					<motion.div
						key="handle"
						className="edit-site-the-frame__handle"
						title="drag to resize"
						onMouseDown={ () => setIsResizing( true ) }
						initial={ {
							opacity: 0,
							left: 0,
						} }
						animate={ {
							opacity: 1,
							left: -15,
						} }
						exit={ {
							opacity: 0,
							left: 0,
						} }
						whileHover={ { scale: 1.1 } }
					/>
				),
			} }
			onResize={ handleResize }
			className={ classnames( 'edit-site-the-frame__inner', {
				resizing: isResizing,
			} ) }
		>
			<motion.div
				className="edit-site-the-frame__content"
				animate={ {
					borderRadius: isFull ? 0 : 8,
				} }
				transition={ FRAME_TRANSITION }
			>
				{ children }
			</motion.div>
		</ResizableBox>
	);
}

export default ResizableFrame;
