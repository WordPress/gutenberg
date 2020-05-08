/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCopyOnClick, compose } from '@wordpress/compose';
import { useRef, useEffect } from '@wordpress/element';

function CopyContentMenuItem( { createNotice, editedPostContent } ) {
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
		editedPostContent.length > 0 && (
			<MenuItem ref={ ref }>
				{ hasCopied ? __( 'Copied!' ) : __( 'Copy all content' ) }
			</MenuItem>
		)
	);
}

export default compose(
	withSelect( ( select ) => ( {
		editedPostContent: select( 'core/editor' ).getEditedPostAttribute(
			'content'
		),
	} ) ),
	withDispatch( ( dispatch ) => {
		const { createNotice } = dispatch( 'core/notices' );

		return {
			createNotice,
		};
	} )
)( CopyContentMenuItem );
