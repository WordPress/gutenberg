import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { trash, Icon } from '@wordpress/icons';
import { store as blockEditorStore } from '../../store';
import { GridItemHandle } from './grid-item-handle';

interface GridItemDeleteHandleProps {
	/** Client ID of the grid item. */
	clientId: string;
}

/**
 * A handle that deletes a selected grid item.
 */
export function GridItemDeleteHandle( {
	clientId,
}: GridItemDeleteHandleProps ) {
	const { removeBlock } = useDispatch( blockEditorStore );

	return (
		// Keyboard users delete blocks from the block toolbar's options menu.
		<GridItemHandle
			className="block-editor-grid-item-handles__delete"
			label={ __( 'Delete' ) }
			onClick={ () => removeBlock( clientId, true ) }
		>
			<Icon icon={ trash } />
		</GridItemHandle>
	);
}
