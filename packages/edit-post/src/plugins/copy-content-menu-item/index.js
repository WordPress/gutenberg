/**
 * WordPress dependencies
 */
import { ClipboardButton } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { withState, compose } from '@wordpress/compose';

function CopyContentMenuItem( {
	createNotice,
	editedPostContent,
	hasCopied,
	setState,
} ) {
	return (
		editedPostContent.length > 0 && (
			<ClipboardButton
				text={ editedPostContent }
				role="menuitem"
				className="components-menu-item__button"
				onCopy={ () => {
					setState( { hasCopied: true } );
					createNotice( 'info', __( 'All content copied.' ), {
						isDismissible: true,
						type: 'snackbar',
					} );
				} }
				onFinishCopy={ () => setState( { hasCopied: false } ) }
			>
				{ hasCopied ? __( 'Copied!' ) : __( 'Copy all content' ) }
			</ClipboardButton>
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
	} ),
	withState( { hasCopied: false } )
)( CopyContentMenuItem );
