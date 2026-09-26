import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store as blockEditorStore } from '../../store';

/**
 * Renders a button that removes the selected block(s).
 *
 * @param props           Component props.
 * @param props.clientIds The client IDs of the selected blocks.
 */
export default function RemoveBlockButton( {
	clientIds,
}: {
	clientIds: string[];
} ) {
	const { canRemove, shortcut } = useSelect(
		( select ) => ( {
			canRemove: select( blockEditorStore ).canRemoveBlocks( clientIds ),
			shortcut: select(
				keyboardShortcutsStore
			).getShortcutRepresentation( 'core/block-editor/remove' ),
		} ),
		[ clientIds ]
	);
	const { removeBlocks } = useDispatch( blockEditorStore );

	const count = clientIds.length;
	const label =
		count > 1
			? sprintf(
					/* translators: %d: number of selected blocks. */
					_n( 'Delete %d block', 'Delete %d blocks', count ),
					count
				)
			: __( 'Delete' );

	return (
		<ToolbarGroup className="block-editor-block-toolbar__remove-block">
			<ToolbarButton
				disabled={ ! canRemove }
				icon={ trash }
				label={ label }
				onClick={ () => removeBlocks( clientIds ) }
				shortcut={ shortcut }
			/>
		</ToolbarGroup>
	);
}
