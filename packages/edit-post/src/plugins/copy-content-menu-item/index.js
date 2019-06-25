/**
 * WordPress dependencies
 */
import { ClipboardButton } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';

function CopyContentMenuItem( { createNotice, editedPostContent } ) {
	return (
		<ClipboardButton
			text={ editedPostContent }
			role="menuitem"
			className="components-menu-item__button"
			onCopy={ () => {
				createNotice(
					'info',
					'All content copied.',
					{
						isDismissible: true,
						type: 'snackbar',
					}
				);
			} }
		>
			{ __( 'Copy All Content' ) }
		</ClipboardButton>
	);
}

export default compose(
	withSelect( ( select ) => ( {
		editedPostContent: select( 'core/editor' ).getEditedPostAttribute( 'content' ),
	} ) ),
	withDispatch( ( dispatch ) => {
		const {
			createNotice,
		} = dispatch( 'core/notices' );

		return {
			createNotice,
		};
	} ),
)( CopyContentMenuItem );
