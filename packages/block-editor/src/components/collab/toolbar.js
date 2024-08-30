/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { collabComment } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';

export default function BlockCommentToolbar( {} ) {
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { openGeneralSidebar } = useDispatch( 'core/edit-post' );

	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const clientId = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const { getSelectedBlockClientId } = select( 'core/block-editor' );
		return getSelectedBlockClientId();
	}, [] );

	const openCollabBoard = () => {
		updateBlockAttributes( clientId, {
			showCommentBoard: true,
		} );
		openGeneralSidebar( 'edit-post/collab-sidebar' );
	};

	return (
		<>
			<ToolbarGroup className="block-editor-block-comment-toolbar">
				<ToolbarButton
					accessibleWhenDisabled
					onClick={ openCollabBoard }
					icon={ collabComment }
					label={ __( 'Comment' ) }
				/>
			</ToolbarGroup>
		</>
	);
}
