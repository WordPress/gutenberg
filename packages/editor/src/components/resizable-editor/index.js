/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useRef, useCallback, useEffect } from '@wordpress/element';
import { ResizableBox } from '@wordpress/components';
import { DEVICE_PREVIEW_WIDTHS } from '@wordpress/block-editor';

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

function ResizableEditor( {
	className,
	enableResizing,
	height,
	children,
	deviceType,
	onDeviceTypeChange,
} ) {
	const [ width, setWidth ] = useState( '100%' );
	const resizableRef = useRef();
	const isResizingRef = useRef( false );

	const resizeWidthBy = useCallback( ( deltaPixels ) => {
		if ( resizableRef.current ) {
			setWidth( resizableRef.current.offsetWidth + deltaPixels );
		}
	}, [] );

	// When deviceType changes, snap the width to the device preset
	useEffect( () => {
		if ( enableResizing && deviceType && deviceType !== 'Custom' ) {
			const deviceWidth = DEVICE_PREVIEW_WIDTHS[ deviceType ];
			setWidth( deviceWidth ?? '100%' );
		}
	}, [ deviceType, enableResizing ] );

	return (
		<ResizableBox
			className={ clsx( 'editor-resizable-editor', className, {
				'is-resizable': enableResizing,
			} ) }
			ref={ ( api ) => {
				resizableRef.current = api?.resizable;
			} }
			size={ {
				width: enableResizing ? width : '100%',
				height: enableResizing && height ? height : '100%',
			} }
			onResizeStart={ () => {
				isResizingRef.current = true;
			} }
			onResizeStop={ ( event, direction, element ) => {
				const newWidth = parseInt( element.style.width );
				setWidth( element.style.width );
				isResizingRef.current = false;

				// Check if the new width matches any device preset
				const matchesPreset = Object.entries(
					DEVICE_PREVIEW_WIDTHS
				).some(
					( [ type, presetWidth ] ) =>
						type !== 'Custom' &&
						presetWidth !== null &&
						Math.abs( newWidth - presetWidth ) < 5 // Allow 5px tolerance
				);

				// If manually resized to a width that doesn't match a preset, switch to Custom
				if (
					enableResizing &&
					onDeviceTypeChange &&
					! matchesPreset &&
					deviceType !== 'Custom'
				) {
					onDeviceTypeChange( 'Custom' );
				}
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
