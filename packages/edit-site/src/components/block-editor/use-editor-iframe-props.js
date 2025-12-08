/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import { store as editorStore } from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

export default function useEditorIframeProps() {
	const { query, path } = useLocation();
	const history = useHistory();
	const { canvas = 'view' } = query;
	const currentPostIsTrashed = useSelect( ( select ) => {
		return (
			select( editorStore ).getCurrentPostAttribute( 'status' ) ===
			'trash'
		);
	}, [] );

	const isEdit = canvas === 'edit';

	const effectFocus = useRefEffect(
		( node ) => {
			const toggleClass = ( { type } ) =>
				node.classList.toggle( 'is-focused', type === 'focus' );
			node.contentWindow.addEventListener( 'focus', toggleClass );
			node.contentWindow.addEventListener( 'blur', toggleClass );
			return () => {
				node.contentWindow.removeEventListener( 'focus', toggleClass );
				node.contentWindow.removeEventListener( 'blur', toggleClass );
				if ( ! isEdit ) {
					node.classList.remove( 'is-focused' );
				}
			};
		},
		[ isEdit ]
	);

	// In view mode, make the canvas iframe be perceived and behave as a button
	// to switch to edit mode, with a meaningful label and no title attribute.
	const viewModeIframeProps = {
		'aria-label': __( 'Edit' ),
		'aria-disabled': currentPostIsTrashed,
		title: null,
		role: 'button',
		onKeyDown: ( event ) => {
			const { keyCode } = event;
			if (
				( keyCode === ENTER || keyCode === SPACE ) &&
				! currentPostIsTrashed
			) {
				event.preventDefault();
				history.navigate( addQueryArgs( path, { canvas: 'edit' } ), {
					transition: 'canvas-mode-edit-transition',
				} );
			}
		},
		onClick: () =>
			history.navigate( addQueryArgs( path, { canvas: 'edit' } ), {
				transition: 'canvas-mode-edit-transition',
			} ),
		onClickCapture: ( event ) => {
			if ( currentPostIsTrashed ) {
				event.preventDefault();
				event.stopPropagation();
			}
		},
		ref: effectFocus,
		readonly: true,
	};

	return {
		className: 'edit-site-visual-editor__editor-canvas',
		...( canvas === 'view' ? viewModeIframeProps : {} ),
	};
}
