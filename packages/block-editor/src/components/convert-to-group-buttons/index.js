/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import { switchToBlockType, store as blocksStore } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function ConvertToGroupButton( { onClose = () => {} } ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const {
		clientIds,
		isGroupable,
		isUngroupable,
		blocksSelection,
		groupingBlockName,
	} = useSelect( ( select ) => {
		const {
			getBlockRootClientId,
			getBlocksByClientId,
			canInsertBlockType,
			getSelectedBlockClientIds,
		} = select( blockEditorStore );
		const { getGroupingBlockName } = select( blocksStore );

		const _clientIds = getSelectedBlockClientIds();
		const _groupingBlockName = getGroupingBlockName();

		const rootClientId = !! _clientIds?.length
			? getBlockRootClientId( _clientIds[ 0 ] )
			: undefined;

		const groupingBlockAvailable = canInsertBlockType(
			_groupingBlockName,
			rootClientId
		);

		const _blocksSelection = getBlocksByClientId( _clientIds );

		const isSingleGroupingBlock =
			_blocksSelection.length === 1 &&
			_blocksSelection[ 0 ]?.name === _groupingBlockName;

		// Do we have
		// 1. Grouping block available to be inserted?
		// 2. One or more blocks selected
		// (we allow single Blocks to become groups unless
		// they are a soltiary group block themselves)
		const _isGroupable =
			groupingBlockAvailable &&
			_blocksSelection.length &&
			! isSingleGroupingBlock;

		// Do we have a single Group Block selected and does that group have inner blocks?
		const _isUngroupable =
			isSingleGroupingBlock &&
			!! _blocksSelection[ 0 ].innerBlocks.length;
		return {
			clientIds: _clientIds,
			isGroupable: _isGroupable,
			isUngroupable: _isUngroupable,
			blocksSelection: _blocksSelection,
			groupingBlockName: _groupingBlockName,
		};
	}, [] );

	const onConvertToGroup = () => {
		// Activate the `transform` on the Grouping Block which does the conversion
		const newBlocks = switchToBlockType(
			blocksSelection,
			groupingBlockName
		);
		if ( newBlocks ) {
			replaceBlocks( clientIds, newBlocks );
		}
	};

	const onConvertFromGroup = () => {
		const innerBlocks = blocksSelection[ 0 ].innerBlocks;
		if ( ! innerBlocks.length ) {
			return;
		}
		replaceBlocks( clientIds, innerBlocks );
	};

	if ( ! isGroupable && ! isUngroupable ) {
		return null;
	}

	return (
		<>
			{ isGroupable && (
				<MenuItem
					onClick={ () => {
						onConvertToGroup();
						onClose();
					} }
				>
					{ _x( 'Group', 'verb' ) }
				</MenuItem>
			) }
			{ isUngroupable && (
				<MenuItem
					onClick={ () => {
						onConvertFromGroup();
						onClose();
					} }
				>
					{ _x(
						'Ungroup',
						'Ungrouping blocks from within a Group block back into individual blocks within the Editor '
					) }
				</MenuItem>
			) }
		</>
	);
}
