/**
 * WordPress dependencies
 */
import { useState, useRef, useCallback } from '@wordpress/element';
import { ResizableBox } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ResizeHandle from './resize-handle';

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

function ResizableEditor( { enableResizing, height, children } ) {
	const [ width, setWidth ] = useState( '100%' );
	const resizableRef = useRef();
	const resizeWidthBy = useCallback( ( deltaPixels ) => {
		if ( resizableRef.current ) {
			setWidth( resizableRef.current.offsetWidth + deltaPixels );
		}
	}, [] );
	return (
		<ResizableBox
			ref={ ( api ) => {
				resizableRef.current = api?.resizable;
			} }
			size={ {
				width: enableResizing ? width : '100%',
				height: enableResizing && height ? height : '100%',
			} }
			onResizeStop={ ( event, direction, element ) => {
				setWidth( element.style.width );
			} }
			minWidth={ 300 }
			maxWidth="100%"
			maxHeight="100%"
			enable={ {
				right: enableResizing,
				left: enableResizing,
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
