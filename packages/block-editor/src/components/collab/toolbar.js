/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { ToolbarButton } from '@wordpress/components';
import { collabComment } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function BlockCommentToolbar() {
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { openGeneralSidebar } = useDispatch( 'core/edit-post' );

	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const clientId = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const { getSelectedBlockClientId } = select( blockEditorStore );
		return getSelectedBlockClientId();
	}, [] );

	const openCollabBoard = () => {
		updateBlockAttributes( clientId, {
			showCommentBoard: true,
		} );
		openGeneralSidebar( 'edit-post/collab-sidebar' );
	};

	return (
		<ToolbarButton
			accessibleWhenDisabled
			icon={ collabComment }
			label={ _x( 'Comment', 'Open comment button' ) }
			onClick={ openCollabBoard }
		/>
	);
}
