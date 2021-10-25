/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { ResizableBox } from '@wordpress/components';
import {
	BlockList,
	__experimentalUseResizeCanvas as useResizeCanvas,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
	__unstableUseMouseMoveTypingReset as useMouseMoveTypingReset,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import ResizeHandle from './resize-handle';

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
	const [ height, setHeight ] = useState( styles.height );
	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
	} = useDispatch( editSiteStore );
	const iframeRef = useRef();
	const mouseMoveTypingResetRef = useMouseMoveTypingReset();
	const ref = useMergeRefs( [ iframeRef, mouseMoveTypingResetRef ] );

	useEffect(
		function setWidthWhenDeviceTypeChanged() {
			if ( deviceType !== RESPONSIVE_DEVICE ) {
				setWidth( resizedCanvasStyles.width );
				previousResizedCanvasStylesRef.current = resizedCanvasStyles;
			}
		},
		[ deviceType, resizedCanvasStyles.width ]
	);

	const resizeWidthBy = useCallback( ( deltaPixels ) => {
		if ( iframeRef.current ) {
			setWidth( `${ iframeRef.current.offsetWidth + deltaPixels }px` );
		}
	}, [] );

	useEffect(
		function autoResizeIframeHeight() {
			const iframe = iframeRef.current;

			if ( ! iframe || ! enableResizing ) {
				return;
			}

			const resizeObserver = new iframe.contentWindow.ResizeObserver(
				() => {
					setHeight( iframe.contentDocument.body.offsetHeight );
				}
			);

			// Observing the <html> rather than the <body> because the latter
			// gets destroyed and remounted after initialization in <Iframe>.
			resizeObserver.observe( iframe.contentDocument.documentElement );

			return () => {
				resizeObserver.disconnect();
			};
		},
		[ enableResizing ]
	);

	return (
		<ResizableBox
			size={ {
				width,
				height,
			} }
			onResizeStop={ ( event, direction, element ) => {
				setWidth( element.style.width );
				setPreviewDeviceType( RESPONSIVE_DEVICE );
			} }
			minWidth={ 300 }
			// Not sure why this is needed to prevent the height from decreasing
			// to 10px while resizing horizontally.
			minHeight={ height }
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
