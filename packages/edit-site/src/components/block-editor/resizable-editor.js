/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { ResizableBox } from '@wordpress/components';
import {
	__experimentalUseResizeCanvas as useResizeCanvas,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
	__unstableUseMouseMoveTypingReset as useMouseMoveTypingReset,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import ResizeHandle from './resize-handle';

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

function isHorizontal( direction ) {
	return direction === 'left' || direction === 'right';
}

function ResizableEditor( { enableResizing, settings, ...props } ) {
	const deviceType = useSelect(
		( select ) =>
			select( editSiteStore ).__experimentalGetPreviewDeviceType(),
		[]
	);
	const deviceStyles = useResizeCanvas( deviceType );
	const [ width, setWidth ] = useState( DEFAULT_STYLES.width );
	const [ height, setHeight ] = useState( DEFAULT_STYLES.height );
	const [ resizingDirection, setResizingDirection ] = useState( null );
	const iframeRef = useRef();
	const mouseMoveTypingResetRef = useMouseMoveTypingReset();
	const ref = useMergeRefs( [ iframeRef, mouseMoveTypingResetRef ] );

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
							`.edit-site-block-editor__block-list`
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
				style={ enableResizing ? undefined : deviceStyles }
				head={
					<>
						<EditorStyles styles={ settings.styles } />
						<style>{
							// Forming a "block formatting context" to prevent margin collapsing.
							// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
							`.edit-site-block-editor__block-list { display: flow-root; }`
						}</style>
					</>
				}
				ref={ ref }
				name="editor-canvas"
				className="edit-site-visual-editor__editor-canvas"
				{ ...props }
			/>
		</ResizableBox>
	);
}

export default ResizableEditor;
