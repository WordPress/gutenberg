/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import UngroupIcon from './icon';
import { store as blockEditorStore } from '../../store';

const noop = () => {};
const EMPTY_BLOCKS_LIST = [];

export function UngroupButton( { onConvertFromGroup, isUngroupable = false } ) {
	if ( ! isUngroupable ) {
		return null;
	}
	return (
		<ToolbarGroup>
			<ToolbarButton
				title={ __( 'Ungroup' ) }
				icon={ UngroupIcon }
				onClick={ onConvertFromGroup }
			/>
		</ToolbarGroup>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const { getSelectedBlockClientId, getBlock } =
			select( blockEditorStore );

		const { getGroupingBlockName } = select( blocksStore );

		const selectedId = getSelectedBlockClientId();
		const selectedBlock = getBlock( selectedId );

		const groupingBlockName = getGroupingBlockName();

		const isUngroupable =
			selectedBlock &&
			selectedBlock.innerBlocks &&
			selectedBlock.innerBlocks.length > 0 &&
			selectedBlock.name === groupingBlockName;

		const innerBlocks = isUngroupable
			? selectedBlock.innerBlocks
			: EMPTY_BLOCKS_LIST;

		return {
			isUngroupable,
			clientId: selectedId,
			innerBlocks,
		};
	} ),
	withDispatch( ( dispatch, { clientId, innerBlocks, onToggle = noop } ) => {
		const { replaceBlocks } = dispatch( blockEditorStore );

		return {
			onConvertFromGroup() {
				if ( ! innerBlocks.length ) {
					return;
				}

				replaceBlocks( clientId, innerBlocks );

				onToggle();
			},
		};
	} ),
] )( UngroupButton );
