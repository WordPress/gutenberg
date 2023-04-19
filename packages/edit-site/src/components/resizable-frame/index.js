/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	ResizableBox,
	__unstableMotion as motion,
	__experimentalText as Text,
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

const devices = [
	{
		label: 'Mobile',
		width: 480,
		height: 640,
	},
	{
		label: 'Tablet',
		width: 1024,
		height: 768,
	},
	{
		label: 'Desktop',
		width: null,
		height: '100%',
	},
];

const FRAME_TRANSITION = { type: 'tween', duration: 0.5 };
const MIN_FRAME_SIZE = 240;

function ResizableFrame( { isFull, children } ) {
	const [ frameWidth, setFrameWidth ] = useState( '100%' );
	const [ frameDevice, setFrameDevice ] = useState( devices[ 2 ] );
	const frameHeight = isFull ? '100%' : frameDevice?.height || '100%';
	const [ isResizing, setIsResizing ] = useState( false );
	const [ isHovering, setIsHovering ] = useState( false );

	return (
		<ResizableBox
			as={ motion.div }
			initial={ false }
			animate={ {
				flexGrow: isFull ? 1 : 0,
				height: frameHeight,
			} }
			transition={ FRAME_TRANSITION }
			size={ {
				width: frameWidth,
				height: frameHeight,
			} }
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
					>
						{ isResizing && ! isFull && (
							<motion.div
								as={ Text }
								size="footnote"
								key="handle-label"
								initial={ {
									opacity: 0,
									x: 20,
								} }
								animate={ {
									opacity: 1,
									x: 0,
								} }
								exit={ {
									opacity: 0,
									x: 20,
								} }
								className="edit-site-the-frame__handle-label"
							>
								{ frameDevice.label }
							</motion.div>
						) }
					</motion.div>
				),
			} }
			onResizeStop={ ( e, direction, ref, d ) => {
				setFrameWidth( frameWidth + d.width );
			} }
			onResize={ ( e, direction, ref ) => {
				const device = devices.find( ( dev ) =>
					dev.width ? ref.clientWidth < dev.width : dev
				);
				setFrameDevice( device );
			} }
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
