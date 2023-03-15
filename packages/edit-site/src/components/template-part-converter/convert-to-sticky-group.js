/**
 * WordPress dependencies
 */
import { switchToBlockType } from '@wordpress/blocks';
import { MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';

const {
	hasStickyPositionSupport,
	useConvertToGroupButtonProps,
	useIsPositionDisabled,
} = unlock( blockEditorPrivateApis );

export default function ConvertToStickyGroup( { selectedClientIds, onClose } ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { clientIds, isGroupable, blocksSelection, groupingBlockName } =
		useConvertToGroupButtonProps( selectedClientIds );

	const { canRemove, hasParents } = useSelect(
		( select ) => {
			const { getBlockParents, canRemoveBlocks } =
				select( blockEditorStore );
			return {
				canRemove: canRemoveBlocks( clientIds ),
				hasParents: !! getBlockParents( clientIds[ 0 ] ).length,
			};
		},
		[ clientIds ]
	);

	const isPositionDisabled = useIsPositionDisabled( {
		name: groupingBlockName,
	} );
	const isStickySupported = hasStickyPositionSupport( groupingBlockName );

	const onConvertToGroup = () => {
		const newBlocks = switchToBlockType(
			blocksSelection,
			groupingBlockName
		);

		if ( newBlocks && newBlocks.length > 0 ) {
			// Because the block is not in the store yet we can't use
			// updateBlockAttributes so need to manually update attributes.
			newBlocks[ 0 ].attributes.layout = {
				type: 'default',
			};
			newBlocks[ 0 ].attributes.style = {
				...( newBlocks[ 0 ].attributes.style || {} ),
				position: {
					type: 'sticky',
					top: '0',
				},
			};
			replaceBlocks( clientIds, newBlocks );
		}
	};

	// For the button to be visible, the following conditions must be met:
	// - The block is groupable.
	// - The block can be removed.
	// - A grouping block is available.
	// - The block and theme both support sticky position.
	// - The block has no parents, so is at the root of the template.
	if (
		! isGroupable ||
		! canRemove ||
		! groupingBlockName ||
		! isStickySupported ||
		hasParents ||
		isPositionDisabled
	) {
		return null;
	}

	// Allow converting a single template part block to a group.
	return (
		<MenuItem
			onClick={ () => {
				onConvertToGroup();
				onClose();
			} }
		>
			{ __( 'Make sticky' ) }
		</MenuItem>
	);
}
