/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCopyOnClick } from '@wordpress/compose';
import { useRef, useEffect } from '@wordpress/element';

export default function CopyContentMenuItem( {
	createNotice,
	editedPostContent,
} ) {
	const ref = useRef();
	const hasCopied = useCopyOnClick( ref, editedPostContent );

	useEffect( () => {
		if ( ! hasCopied ) {
			return;
		}

		createNotice( 'info', __( 'All content copied.' ), {
			isDismissible: true,
			type: 'snackbar',
		} );
	}, [ hasCopied ] );

	return (
		<MenuItem ref={ ref } disabled>
			{ hasCopied ? __( 'Copied!' ) : __( 'Copy all content' ) }
		</MenuItem>
	);
}
