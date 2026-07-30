/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCopyToClipboard } from '@wordpress/compose';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function CopyContentMenuItem() {
	const { createNotice } = useDispatch( noticesStore );
	const { getEditedPostContent } = useSelect( editorStore );

	function getText() {
		return getEditedPostContent();
	}

	function onSuccess() {
		createNotice( 'info', __( 'All content copied.' ), {
			isDismissible: true,
			type: 'snackbar',
		} );
	}

	const ref = useCopyToClipboard( getText, onSuccess );

	return <MenuItem ref={ ref }>{ __( 'Copy all blocks' ) }</MenuItem>;
}
