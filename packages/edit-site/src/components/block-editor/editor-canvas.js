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

const { EditorCanvas: EditorCanvasRoot } = unlock( editorPrivateApis );

function EditorCanvas( { enableResizing, settings, children, ...props } ) {
	const { hasBlocks, isFocusMode, templateType, canvasMode } = useSelect(
		( select ) => {
			const { getBlockCount } = select( blockEditorStore );
			const { getEditedPostType, getCanvasMode } = unlock(
				select( editSiteStore )
			);
			const _templateType = getEditedPostType();

			return {
				templateType: _templateType,
				isFocusMode: FOCUSABLE_ENTITIES.includes( _templateType ),
				canvasMode: getCanvasMode(),
				hasBlocks: !! getBlockCount(),
			};
		},
		[]
	);
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
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
						? 'cursor: pointer; min-height: 100vh;'
						: ''
				}}}`,
			},
		],
		[ settings.styles, enableResizing, canvasMode ]
	);

	return (
		<EditorCanvasRoot
			className={ classnames( 'edit-site-editor-canvas__block-list', {
				'is-navigation-block': isTemplateTypeNavigation,
			} ) }
			renderAppender={ showBlockAppender }
			styles={ styles }
			iframeProps={ {
				shouldZoom: true,
				className: classnames(
					'edit-site-visual-editor__editor-canvas',
					{
						'is-focused': isFocused && canvasMode === 'view',
					}
				),
				...props,
				...( canvasMode === 'view' ? viewModeProps : {} ),
			} }
		>
			{ children }
		</EditorCanvasRoot>
	);
}

export default EditorCanvas;
