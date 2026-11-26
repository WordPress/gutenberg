import { ToolbarButton } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import { store as blockEditorStore } from '../../store';

interface GridItemDeleteHandleProps {
	/** Client ID of the grid item. */
	clientId: string;
}

/**
 * A button that deletes a selected grid item, in its toolbar of handles.
 *
 * Unlike the handles that drag or turn the block, it is a toolbar item, so it
 * can be reached from the keyboard.
 */
export function GridItemDeleteHandle( {
	clientId,
}: GridItemDeleteHandleProps ) {
	const { removeBlock } = useDispatch( blockEditorStore );

	return (
		<ToolbarButton
			className="block-editor-grid-item-handle block-editor-grid-item-handles__delete"
			size="small"
			icon={ trash }
			label={ __( 'Delete' ) }
			onClick={ () => removeBlock( clientId, true ) }
		/>
	);
}
