/**
 * WordPress dependencies
 */
import { useState, useRef, useCallback } from '@wordpress/element';
import { ResizableBox } from '@wordpress/components';
import {
	__experimentalUseResizeCanvas as useResizeCanvas,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
	__unstableUseMouseMoveTypingReset as useMouseMoveTypingReset,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMergeRefs, useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
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

function ResizableEditor( { enableResizing, settings, children, ...props } ) {
	const [ resizeObserver, sizes ] = useResizeObserver();
	const { deviceType, isZoomOutMode, canvasMode } = useSelect(
		( select ) => ( {
			deviceType:
				select( editSiteStore ).__experimentalGetPreviewDeviceType(),
			canvasMode: select( editSiteStore ).__unstableGetCanvasMode(),
			isZoomOutMode:
				select( blockEditorStore ).__unstableGetEditorMode() ===
				'zoom-out',
		} ),
		[]
	);
	const deviceStyles = useResizeCanvas( deviceType );
	const [ width, setWidth ] = useState( '100%' );
	const iframeRef = useRef();
	const mouseMoveTypingResetRef = useMouseMoveTypingReset();
	const ref = useMergeRefs( [ iframeRef, mouseMoveTypingResetRef ] );

	const resizeWidthBy = useCallback( ( deltaPixels ) => {
		if ( iframeRef.current ) {
			setWidth( iframeRef.current.offsetWidth + deltaPixels );
		}
	}, [] );
	return (
		<ResizableBox
			size={ {
				width: enableResizing ? width : '100%',
				height: enableResizing && sizes.height ? sizes.height : '100%',
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
			<Iframe
				scale={
					( isZoomOutMode && 0.45 ) ||
					( canvasMode === 'view' && 0.8 ) ||
					undefined
				}
				frameSize={ isZoomOutMode ? 100 : undefined }
				style={ enableResizing ? {} : deviceStyles }
				head={
					<>
						<EditorStyles styles={ settings.styles } />
						<style>{
							// Forming a "block formatting context" to prevent margin collapsing.
							// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
							`.is-root-container { display: flow-root; }
							body { position: relative; }`
						}</style>
						{ enableResizing && (
							<style>
								{
									// Some themes will have `min-height: 100vh` for the root container,
									// which isn't a requirement in auto resize mode.
									`.is-root-container { min-height: 0 !important; }`
								}
							</style>
						) }
					</>
				}
				assets={ settings.__unstableResolvedAssets }
				ref={ ref }
				name="editor-canvas"
				className="edit-site-visual-editor__editor-canvas"
				{ ...props }
			>
				{ /* Filters need to be rendered before children to avoid Safari rendering issues. */ }
				{ settings.svgFilters }
				{ resizeObserver }
				{ children }
			</Iframe>
		</ResizableBox>
	);
}

export default ResizableEditor;
