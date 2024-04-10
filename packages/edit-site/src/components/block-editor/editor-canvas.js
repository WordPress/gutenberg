/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import {
	FOCUSABLE_ENTITIES,
	NAVIGATION_POST_TYPE,
} from '../../utils/constants';
import { computeIFrameScale } from '../../utils/math';

const { EditorCanvas: EditorCanvasRoot } = unlock( editorPrivateApis );

function EditorCanvas( {
	enableResizing,
	settings,
	children,
	onClick,
	...props
} ) {
	const {
		hasBlocks,
		isFocusMode,
		templateType,
		canvasMode,
		isZoomOutMode,
		currentPostIsTrashed,
	} = useSelect( ( select ) => {
		const { getBlockCount, __unstableGetEditorMode } =
			select( blockEditorStore );
		const { getEditedPostType, getCanvasMode } = unlock(
			select( editSiteStore )
		);
		const _templateType = getEditedPostType();

		return {
			templateType: _templateType,
			isFocusMode: FOCUSABLE_ENTITIES.includes( _templateType ),
			isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
			canvasMode: getCanvasMode(),
			hasBlocks: !! getBlockCount(),
			currentPostIsTrashed:
				select( editorStore ).getCurrentPostAttribute( 'status' ) ===
				'trash',
		};
	}, [] );
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const [ isFocused, setIsFocused ] = useState( false );

	useEffect( () => {
		if ( canvasMode === 'edit' ) {
			setIsFocused( false );
		}
	}, [ canvasMode ] );

	// In view mode, make the canvas iframe be perceived and behave as a button
	// to switch to edit mode, with a meaningful label and no title attribute.
	const viewModeIframeProps = {
		'aria-label': __( 'Edit' ),
		'aria-disabled': currentPostIsTrashed,
		title: null,
		role: 'button',
		tabIndex: 0,
		onFocus: () => setIsFocused( true ),
		onBlur: () => setIsFocused( false ),
		onKeyDown: ( event ) => {
			const { keyCode } = event;
			if (
				( keyCode === ENTER || keyCode === SPACE ) &&
				! currentPostIsTrashed
			) {
				event.preventDefault();
				setCanvasMode( 'edit' );
			}
		},
		onClick: () => {
			if ( !! onClick ) {
				onClick();
			} else {
				setCanvasMode( 'edit' );
			}
		},
		onClickCapture: ( event ) => {
			if ( currentPostIsTrashed ) {
				event.preventDefault();
				event.stopPropagation();
			}
		},
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

	const styles = useMemo(
		() => [
			...settings.styles,
			{
				// Forming a "block formatting context" to prevent margin collapsing.
				// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context

				css: `.is-root-container{display:flow-root;${
					// Some themes will have `min-height: 100vh` for the root container,
					// which isn't a requirement in auto resize mode.
					enableResizing ? 'min-height:0!important;' : ''
				}}body{position:relative; ${
					canvasMode === 'view'
						? `min-height: 100vh; ${
								currentPostIsTrashed ? '' : 'cursor: pointer;'
						  }`
						: ''
				}}}`,
			},
		],
		[ settings.styles, enableResizing, canvasMode, currentPostIsTrashed ]
	);

	const frameSize = isZoomOutMode ? 20 : undefined;

	const scale = isZoomOutMode
		? ( contentWidth ) =>
				computeIFrameScale(
					{ width: 1000, scale: 0.55 },
					{ width: 400, scale: 0.9 },
					contentWidth
				)
		: undefined;

	return (
		<EditorCanvasRoot
			className={ classnames( 'edit-site-editor-canvas__block-list', {
				'is-navigation-block': isTemplateTypeNavigation,
			} ) }
			renderAppender={ showBlockAppender }
			styles={ styles }
			iframeProps={ {
				scale,
				frameSize,
				className: classnames(
					'edit-site-visual-editor__editor-canvas',
					{
						'is-focused': isFocused && canvasMode === 'view',
					}
				),
				...props,
				...( canvasMode === 'view' ? viewModeIframeProps : {} ),
			} }
		>
			{ children }
		</EditorCanvasRoot>
	);
}

export default EditorCanvas;
