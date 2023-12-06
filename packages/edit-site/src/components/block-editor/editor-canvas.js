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
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import {
	FOCUSABLE_ENTITIES,
	NAVIGATION_POST_TYPE,
} from '../../utils/constants';

const { ExperimentalBlockCanvas: BlockCanvas } = unlock(
	blockEditorPrivateApis
);
const { EditorCanvas: EditorCanvasRoot } = unlock( editorPrivateApis );

function EditorCanvas( {
	enableResizing,
	settings,
	children,
	contentRef,
	...props
} ) {
	const {
		hasBlocks,
		isFocusMode,
		templateType,
		canvasMode,
		deviceType,
		isZoomOutMode,
	} = useSelect( ( select ) => {
		const { getBlockCount, __unstableGetEditorMode } =
			select( blockEditorStore );
		const {
			getEditedPostType,
			__experimentalGetPreviewDeviceType,
			getCanvasMode,
		} = unlock( select( editSiteStore ) );
		const _templateType = getEditedPostType();

		return {
			templateType: _templateType,
			isFocusMode: FOCUSABLE_ENTITIES.includes( _templateType ),
			deviceType: __experimentalGetPreviewDeviceType(),
			isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
			canvasMode: getCanvasMode(),
			hasBlocks: !! getBlockCount(),
		};
	}, [] );
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
	const isTemplateTypeNavigation = templateType === NAVIGATION_POST_TYPE;
	const isNavigationFocusMode = isTemplateTypeNavigation && isFocusMode;
	// Hide the appender when:
	// - In navigation focus mode (should only allow the root Nav block).
	// - In view mode (i.e. not editing).
	const showBlockAppender =
		( isNavigationFocusMode && hasBlocks ) || canvasMode === 'view'
			? false
			: undefined;

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
			<EditorCanvasRoot
				dropZoneElement={ contentRef.current?.parentNode }
				className={ classnames( 'edit-site-editor-canvas__block-list', {
					'is-navigation-block': isTemplateTypeNavigation,
				} ) }
				renderAppender={ showBlockAppender }
			/>
			{ children }
		</BlockCanvas>
	);
}

export default EditorCanvas;
