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

const ROOT_CONTAINER_CLASS_NAME = 'edit-site-block-editor__root-container';

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
	const [ resizingDirection, setResizingDirection ] = useState( null );
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

	const resizeBy = useCallback( ( deltaWidth, deltaHeight ) => {
		if ( deltaWidth > 0 ) {
			setResizingDirection( 'right' );
		} else if ( deltaWidth < 0 ) {
			setResizingDirection( 'left' );
		} else {
			setResizingDirection( 'down' );
		}

		setWidth( iframeRef.current.offsetWidth + deltaWidth );
		setHeight( ( currentHeight ) => currentHeight + deltaHeight );
	}, [] );

	useEffect(
		function autoResizeIframeHeight() {
			const iframe = iframeRef.current;

			if (
				! iframe ||
				! enableResizing ||
				// Disable auto size after the user has manually resized it.
				resizingDirection !== null
			) {
				return;
			}

			const resizeObserver = new iframe.contentWindow.ResizeObserver(
				() => {
					setHeight(
						iframe.contentDocument.querySelector(
							`.${ ROOT_CONTAINER_CLASS_NAME }`
						).offsetHeight
					);
				}
			);

			// Observing the <html> rather than the <body> because the latter
			// gets destroyed and remounted after initialization in <Iframe>.
			resizeObserver.observe( iframe.contentDocument.documentElement );

			return () => {
				resizeObserver.disconnect();
			};
		},
		[ enableResizing, resizingDirection ]
	);

	return (
		<ResizableBox
			size={ {
				width,
				height,
			} }
			onResizeStart={ ( event, direction ) => {
				setResizingDirection( direction );
			} }
			onResizeStop={ ( event, direction, element ) => {
				setWidth( element.style.width );
				setHeight( parseInt( element.style.height, 10 ) );
				setPreviewDeviceType( RESPONSIVE_DEVICE );
			} }
			minWidth={ 300 }
			maxWidth="100%"
			maxHeight="100%"
			enable={ {
				right: enableResizing,
				left: enableResizing,
				bottom: enableResizing,
			} }
			showHandle={ enableResizing }
			// The editor is centered horizontally, resizing it only
			// moves half the distance. Hence double the ratio to correctly
			// align the cursor to the resizer handle.
			resizeRatio={ isHorizontal( resizingDirection ) ? 2 : 1 }
			handleComponent={ {
				left: <ResizeHandle direction="left" resizeBy={ resizeBy } />,
				right: <ResizeHandle direction="right" resizeBy={ resizeBy } />,
				bottom: <ResizeHandle direction="down" resizeBy={ resizeBy } />,
			} }
			handleClasses={ undefined }
			handleStyles={ {
				left: HANDLE_STYLES_OVERRIDE,
				right: HANDLE_STYLES_OVERRIDE,
				bottom: HANDLE_STYLES_OVERRIDE,
			} }
		>
			<Iframe
				style={
					// We'll be using the size controlled by ResizableBox so resetting them here.
					omit( styles, [ 'width', 'height', 'margin' ] )
				}
				head={
					<>
						<EditorStyles styles={ settings.styles } />
						<style>{
							// Forming a "block formatting context" to prevent margin collapsing.
							// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
							`.${ ROOT_CONTAINER_CLASS_NAME } { display: flow-root; }`
						}</style>
					</>
				}
				ref={ ref }
				name="editor-canvas"
				className="edit-site-visual-editor__editor-canvas"
				{ ...props }
			>
				<BlockList
					className={ `edit-site-block-editor__block-list wp-site-blocks ${ ROOT_CONTAINER_CLASS_NAME }` }
					__experimentalLayout={ LAYOUT }
				/>
			</Iframe>
		</ResizableBox>
	);
}

function isHorizontal( direction ) {
	return direction === 'left' || direction === 'right';
}

export default ResizableEditor;
