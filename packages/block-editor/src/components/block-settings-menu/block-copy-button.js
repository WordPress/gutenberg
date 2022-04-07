/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { serialize } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function CopyMenuItem( { blocks, onCopy } ) {
	const {
		hasMultiSelection,
		__unstableIsFullySelected,
		__unstableIsSelectionMergeable,
		__unstableGetSelectedBlocksWithPartialSelection,
	} = useSelect( blockEditorStore );
	if (
		hasMultiSelection() &&
		! __unstableIsFullySelected() &&
		__unstableIsSelectionMergeable()
	) {
		const [
			head,
			tail,
		] = __unstableGetSelectedBlocksWithPartialSelection();
		const inBetweenBlocks = blocks.slice( 1, blocks.length - 1 );
		blocks = [ head, ...inBetweenBlocks, tail ];
	}
	const ref = useCopyToClipboard( () => serialize( blocks ), onCopy );
	return <MenuItem ref={ ref }>{ __( 'Copy' ) }</MenuItem>;
}
