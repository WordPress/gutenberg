/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';
import { ResizableBox } from '@wordpress/components';
import {
	BlockList,
	__experimentalUseResizeCanvas as useResizeCanvas,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
	__unstableUseMouseMoveTypingReset as useMouseMoveTypingReset,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

const LAYOUT = {
	type: 'default',
	// At the root level of the site editor, no alignments should be allowed.
	alignments: [],
};

const RESPONSIVE_DEVICE = 'responsive';

const DEFAULT_STYLES = {
	width: '100%',
	height: '100%',
};

function ResizableEditor( { enableResizing, settings, ...props } ) {
	const deviceType = useSelect(
		( select ) =>
			select( editSiteStore ).__experimentalGetPreviewDeviceType(),
		[]
	);
	const resizedCanvasStyles = useResizeCanvas( deviceType ) ?? DEFAULT_STYLES;
	const previousResizedCanvasStylesRef = useRef( resizedCanvasStyles );
	// Keep the height of the canvas when resizing on each device type.
	const styles =
		deviceType === RESPONSIVE_DEVICE
			? previousResizedCanvasStylesRef.current
			: resizedCanvasStyles;
	const [ width, setWidth ] = useState( styles.width );
	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
	} = useDispatch( editSiteStore );
	const ref = useMouseMoveTypingReset();

	useEffect(
		function setWidthWhenDeviceTypeChanged() {
			if ( deviceType !== RESPONSIVE_DEVICE ) {
				setWidth( resizedCanvasStyles.width );
				previousResizedCanvasStylesRef.current = resizedCanvasStyles;
			}
		},
		[ deviceType, resizedCanvasStyles.width ]
	);

	return (
		<ResizableBox
			size={ {
				width,
				height: styles.height,
			} }
			onResizeStop={ ( event, direction, element ) => {
				setWidth( element.style.width );
				setPreviewDeviceType( RESPONSIVE_DEVICE );
			} }
			minWidth={ 300 }
			maxWidth="100%"
			enable={ {
				right: enableResizing,
				left: enableResizing,
			} }
			showHandle={ enableResizing }
			// The editor is centered horizontally, resizing it only
			// moves half the distance. Hence double the ratio to correctly
			// align the cursor to the resizer handle.
			resizeRatio={ 2 }
		>
			<Iframe
				style={
					// We'll be using the size controlled by ResizableBox so resetting them here.
					omit( styles, [ 'width', 'height', 'margin' ] )
				}
				head={ <EditorStyles styles={ settings.styles } /> }
				ref={ ref }
				name="editor-canvas"
				className="edit-site-visual-editor__editor-canvas"
				{ ...props }
			>
				<BlockList
					className="edit-site-block-editor__block-list wp-site-blocks"
					__experimentalLayout={ LAYOUT }
				/>
			</Iframe>
		</ResizableBox>
	);
}

export default ResizableEditor;
