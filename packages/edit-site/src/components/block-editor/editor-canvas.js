/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalUseResizeCanvas as useResizeCanvas,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
	__unstableUseMouseMoveTypingReset as useMouseMoveTypingReset,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';

function EditorCanvas( { enableResizing, settings, children, ...props } ) {
	const { canvasMode, deviceType, isZoomOutMode } = useSelect(
		( select ) => ( {
			deviceType:
				select( editSiteStore ).__experimentalGetPreviewDeviceType(),
			isZoomOutMode:
				select( blockEditorStore ).__unstableGetEditorMode() ===
				'zoom-out',
			canvasMode: unlock( select( editSiteStore ) ).getCanvasMode(),
		} ),
		[]
	);
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const deviceStyles = useResizeCanvas( deviceType );
	const iframeRef = useRef();
	const mouseMoveTypingRef = useMouseMoveTypingReset();

	const viewModeProps = {
		'aria-label': __( 'Editor Canvas' ),
		role: 'button',
		tabIndex: 0,
		onKeyDown: ( event ) => {
			const { keyCode } = event;
			if ( keyCode === ENTER || keyCode === SPACE ) {
				event.preventDefault();
				setCanvasMode( 'edit' );
				iframeRef.current.removeAttribute( 'inert' );
				iframeRef.current.focus();
			}
		},
		onClick: () => {
			setCanvasMode( 'edit' );
			iframeRef.current.removeAttribute( 'inert' );
			iframeRef.current.focus();
		},
	};

	return (
		<div
			{ ...( canvasMode === 'view' ? viewModeProps : {} ) }
			className={ classnames( 'edit-site-visual-editor__editor-canvas' ) }
		>
			<Iframe
				expand={ isZoomOutMode }
				scale={ ( isZoomOutMode && 0.45 ) || undefined }
				frameSize={ isZoomOutMode ? 100 : undefined }
				style={ enableResizing ? {} : deviceStyles }
				ref={ useMergeRefs( [ iframeRef, mouseMoveTypingRef ] ) }
				name="editor-canvas"
				{ ...props }
				tabIndex={ canvasMode === 'view' ? '-1' : '0' }
				inert={ canvasMode === 'view' ? 'true' : undefined }
			>
				<EditorStyles styles={ settings.styles } />
				<style>{
					// Forming a "block formatting context" to prevent margin collapsing.
					// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
					`.is-root-container{display:flow-root;${
						// Some themes will have `min-height: 100vh` for the root container,
						// which isn't a requirement in auto resize mode.
						enableResizing ? 'min-height:0!important;' : ''
					}}body{position:relative; ${
						canvasMode === 'view' ? 'cursor: pointer;' : ''
					}}}`
				}</style>
				{ children }
			</Iframe>
		</div>
	);
}

export default EditorCanvas;
