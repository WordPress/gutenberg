/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { switchToBlockType, store as blocksStore } from '@wordpress/blocks';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { group, row, stack } from '@wordpress/icons';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useConvertToGroupButtonProps } from '../convert-to-group-buttons';
import { store as blockEditorStore } from '../../store';

const layouts = {
	group: { type: 'constrained' },
	row: { type: 'flex', flexWrap: 'nowrap' },
	stack: { type: 'flex', orientation: 'vertical' },
};

function BlockGroupToolbar() {
	const { blocksSelection, clientIds, groupingBlockName, isGroupable } =
		useConvertToGroupButtonProps();
	const { replaceBlocks } = useDispatch( blockEditorStore );

	const { canRemove, variations } = useSelect(
		( select ) => {
			const { canRemoveBlocks } = select( blockEditorStore );
			const { getBlockVariations } = select( blocksStore );

			return {
				canRemove: canRemoveBlocks( clientIds ),
				variations: getBlockVariations(
					groupingBlockName,
					'transform'
				),
			};
		},
		[ clientIds, groupingBlockName ]
	);

	const onConvertToGroup = ( layout ) => {
		const newBlocks = switchToBlockType(
			blocksSelection,
			groupingBlockName
		);

		if ( typeof layout !== 'string' ) {
			layout = 'group';
		}

		if ( newBlocks && newBlocks.length > 0 ) {
			// Because the block is not in the store yet we can't use
			// updateBlockAttributes so need to manually update attributes.
			newBlocks[ 0 ].attributes.layout = layouts[ layout ];
			replaceBlocks( clientIds, newBlocks );
		}
	};

	const onConvertToRow = () => onConvertToGroup( 'row' );
	const onConvertToStack = () => onConvertToGroup( 'stack' );

	// Don't render the button if the current selection cannot be grouped.
	// A good example is selecting multiple button blocks within a Buttons block:
	// The group block is not a valid child of Buttons, so we should not show the button.
	// Any blocks that are locked against removal also cannot be grouped.
	if ( ! isGroupable || ! canRemove ) {
		return null;
	}

	const canInsertRow = !! variations.find(
		( { name } ) => name === 'group-row'
	);
	const canInsertStack = !! variations.find(
		( { name } ) => name === 'group-stack'
	);

	return (
		<ToolbarGroup>
			<ToolbarButton
				icon={ group }
				label={ _x( 'Group', 'verb' ) }
				onClick={ onConvertToGroup }
			/>
			{ canInsertRow && (
				<ToolbarButton
					icon={ row }
					label={ _x( 'Row', 'single horizontal line' ) }
					onClick={ onConvertToRow }
				/>
			) }
			{ canInsertStack && (
				<ToolbarButton
					icon={ stack }
					label={ _x( 'Stack', 'verb' ) }
					onClick={ onConvertToStack }
				/>
			) }
		</ToolbarGroup>
	);
}

export default BlockGroupToolbar;
