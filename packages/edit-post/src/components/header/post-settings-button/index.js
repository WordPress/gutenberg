/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { cog } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

export default function PostSettingsButton( { showIconLabels } ) {
	const documentLabel = useSelect( ( select ) => {
		const currentPostType = select( 'core/editor' ).getCurrentPostType();
		const postType = select( 'core' ).getPostType( currentPostType );

		return (
			// Disable reason: Post type labels object is shaped like this.
			// eslint-disable-next-line camelcase
			postType?.labels?.singular_name ??
			// translators: Default label for the Document sidebar tab, not selected.
			__( 'Document' )
		);
	}, [] );

	const { openModal } = useDispatch( 'core/edit-post' );

	return (
		<Button
			className="edit-post-post-settings-button"
			label={ sprintf(
				/* translators: %s: singular document type. */
				__( '%s settings' ),
				documentLabel
			) }
			icon={ cog }
			isTertiary={ showIconLabels }
			showTooltip={ ! showIconLabels }
			onClick={ () => {
				openModal( 'edit-post/post-settings' );
			} }
			aria-haspopup="dialog"
		/>
	);
}
