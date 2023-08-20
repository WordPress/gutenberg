/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { select, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCopyToClipboard } from '@wordpress/compose';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '@wordpress/editor';

export default function CopyContentMenuItem() {
	const { createNotice } = useDispatch( noticesStore );

	function onSuccess() {
		createNotice( 'info', __( 'All content copied.' ), {
			isDismissible: true,
			type: 'snackbar',
		} );
	}

	const ref = useCopyToClipboard(
		() => select( editorStore ).getEditedPostAttribute( 'content' ),
		onSuccess
	);

	return <MenuItem ref={ ref }>{ __( 'Copy all blocks' ) }</MenuItem>;
}
