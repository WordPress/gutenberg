/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as editorStore } from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

export default function useEditorIframeProps() {
	const { params } = useLocation();
	const history = useHistory();
	const { canvasMode = 'view' } = params;
	const currentPostIsTrashed = useSelect( ( select ) => {
		return (
			select( editorStore ).getCurrentPostAttribute( 'status' ) ===
			'trash'
		);
	}, [] );
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
				history.push( { ...params, canvasMode: 'edit' }, undefined, {
					transition: 'canvas-mode-edit-transition',
				} );
			}
		},
		onClick: () => {
			history.push( { ...params, canvasMode: 'edit' }, undefined, {
				transition: 'canvas-mode-edit-transition',
			} );
		},
		onClickCapture: ( event ) => {
			if ( currentPostIsTrashed ) {
				event.preventDefault();
				event.stopPropagation();
			}
		},
		readonly: true,
	};

	return {
		className: clsx( 'edit-site-visual-editor__editor-canvas', {
			'is-focused': isFocused && canvasMode === 'view',
		} ),
		...( canvasMode === 'view' ? viewModeIframeProps : {} ),
	};
}
