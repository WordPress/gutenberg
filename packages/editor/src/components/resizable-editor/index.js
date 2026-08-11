import clsx from 'clsx';
import { useDispatch } from '@wordpress/data';
import { useRef, useCallback, useState } from '@wordpress/element';
import {
	ResizableBox,
	__unstableMotion as motion,
} from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';
import ResizeHandle from './resize-handle';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

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

/**
 * Checks if the current width is at the max width.
 *
 * @param {number} currentWidth   - The current width of the editor.
 * @param {number} containerWidth - The width of the container.
 * @param {number} tolerance      - The tolerance for the max width in pixels.
 * @return {boolean} - True if the current width is at the max width, false otherwise.
 */
function isAtMaxWidth( currentWidth, containerWidth, tolerance = 0 ) {
	return containerWidth > 0 && currentWidth >= containerWidth - tolerance;
}

function ResizableEditor( {
	className,
	enableResizing,
	width = '100%',
	height = '100%',
	children,
} ) {
	const [ isResizing, setIsResizing ] = useState( false );
	const disableMotion = useReducedMotion();
	const { setCanvasWidth } = unlock( useDispatch( editorStore ) );

	const resizableRef = useRef();
	const resizeWidthBy = useCallback(
		( deltaPixels ) => {
			if ( resizableRef.current ) {
				const _isAtMaxWidth = isAtMaxWidth(
					resizableRef.current.offsetWidth + deltaPixels,
					resizableRef.current.parentElement?.offsetWidth ?? 0,
					80
				);
				setCanvasWidth(
					_isAtMaxWidth
						? undefined
						: resizableRef.current.offsetWidth + deltaPixels
				);
			}
		},
		[ setCanvasWidth ]
	);

	const updateCanvasWidth = useCallback(
		( element, isResizeEnd ) => {
			const currentWidth = element.offsetWidth;
			const containerWidth = element.parentElement?.offsetWidth ?? 0;
			setCanvasWidth(
				isResizeEnd && isAtMaxWidth( currentWidth, containerWidth, 80 )
					? undefined
					: currentWidth
			);
		},
		[ setCanvasWidth ]
	);

	return (
		<ResizableBox
			as={ motion.div }
			initial={ false }
			animate={ { height } }
			transition={ {
				type: 'tween',
				duration: isResizing || disableMotion ? 0 : 0.2,
				ease: 'easeOut',
			} }
			className={ clsx( 'editor-resizable-editor', className, {
				'is-resizable': enableResizing,
				'is-resizing': isResizing,
			} ) }
			ref={ ( api ) => {
				resizableRef.current = api?.resizable;
			} }
			size={ {
				width,
				height,
			} }
			onResizeStart={ () => {
				setIsResizing( true );
			} }
			onResize={ ( event, direction, element ) => {
				updateCanvasWidth( element );
			} }
			onResizeStop={ ( event, direction, element ) => {
				updateCanvasWidth( element, true );
				setIsResizing( false );
			} }
			minWidth={ 300 }
			maxWidth="100%"
			maxHeight="100%"
			enable={ {
				left: enableResizing,
				right: enableResizing,
			} }
			showHandle={ enableResizing }
			// The editor is centered horizontally, resizing it only
			// moves half the distance. Hence double the ratio to correctly
			// align the cursor to the resizer handle.
			resizeRatio={ 2 }
			handleComponent={ {
				left: (
					<ResizeHandle
						direction="left"
						resizeWidthBy={ resizeWidthBy }
					/>
				),
				right: (
					<ResizeHandle
						direction="right"
						resizeWidthBy={ resizeWidthBy }
					/>
				),
			} }
			handleClasses={ undefined }
			handleStyles={ {
				left: HANDLE_STYLES_OVERRIDE,
				right: HANDLE_STYLES_OVERRIDE,
			} }
		>
			{ children }
		</ResizableBox>
	);
}

export default ResizableEditor;
