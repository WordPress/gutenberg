/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalUseResizeCanvas as useResizeCanvas,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

const { ExperimentalBlockCanvas: BlockCanvas } = unlock(
	blockEditorPrivateApis
);

function EditorCanvas( {
	enableResizing,
	settings,
	children,
	contentRef,
	...props
} ) {
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
	const [ isFocused, setIsFocused ] = useState( false );

	useEffect( () => {
		if ( canvasMode === 'edit' ) {
			setIsFocused( false );
		}
	}, [ canvasMode ] );

	const viewModeProps = {
		'aria-label': __( 'Editor Canvas' ),
		role: 'button',
		tabIndex: 0,
		onFocus: () => setIsFocused( true ),
		onBlur: () => setIsFocused( false ),
		onKeyDown: ( event ) => {
			const { keyCode } = event;
			if ( keyCode === ENTER || keyCode === SPACE ) {
				event.preventDefault();
				setCanvasMode( 'edit' );
			}
		},
		onClick: () => setCanvasMode( 'edit' ),
		readonly: true,
	};

	return (
		<BlockCanvas
			height="100%"
			iframeProps={ {
				expand: isZoomOutMode,
				scale: isZoomOutMode ? 0.45 : undefined,
				frameSize: isZoomOutMode ? 100 : undefined,
				style: enableResizing ? {} : deviceStyles,
				className: classnames(
					'edit-site-visual-editor__editor-canvas',
					{
						'is-focused': isFocused && canvasMode === 'view',
					}
				),
				...props,
				...( canvasMode === 'view' ? viewModeProps : {} ),
			} }
			styles={ settings.styles }
			contentRef={ contentRef }
		>
			<style>{
				// Forming a "block formatting context" to prevent margin collapsing.
				// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
				`.is-root-container{display:flow-root;${
					// Some themes will have `min-height: 100vh` for the root container,
					// which isn't a requirement in auto resize mode.
					enableResizing ? 'min-height:0!important;' : ''
				}}body{position:relative; ${
					canvasMode === 'view'
						? 'cursor: pointer; min-height: 100vh;'
						: ''
				}}}`
			}</style>
			{ children }
		</BlockCanvas>
	);
}

export default EditorCanvas;
