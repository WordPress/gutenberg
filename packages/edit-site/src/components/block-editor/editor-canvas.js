/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
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

const { VisualEditor } = unlock( editorPrivateApis );

function EditorCanvas( { settings } ) {
	const { canvasMode, currentPostIsTrashed } = useSelect( ( select ) => {
		const { getCanvasMode } = unlock( select( editSiteStore ) );

		return {
			canvasMode: getCanvasMode(),
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
			setCanvasMode( 'edit' );
		},
		onClickCapture: ( event ) => {
			if ( currentPostIsTrashed ) {
				event.preventDefault();
				event.stopPropagation();
			}
		},
		readonly: true,
	};

	const styles = useMemo(
		() => [
			...settings.styles,
			{
				// Forming a "block formatting context" to prevent margin collapsing.
				// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context

				css: `body{${
					canvasMode === 'view'
						? `min-height: 100vh; ${
								currentPostIsTrashed ? '' : 'cursor: pointer;'
						  }`
						: ''
				}}}`,
			},
		],
		[ settings.styles, canvasMode, currentPostIsTrashed ]
	);

	return (
		<VisualEditor
			styles={ styles }
			iframeProps={ {
				className: clsx( 'edit-site-visual-editor__editor-canvas', {
					'is-focused': isFocused && canvasMode === 'view',
				} ),
				...( canvasMode === 'view' ? viewModeIframeProps : {} ),
			} }
		/>
	);
}

export default EditorCanvas;
