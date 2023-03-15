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

const { useConvertToGroupButtonProps } = unlock( blockEditorPrivateApis );

export default function ConvertToStickyGroup( { selectedClientIds, onClose } ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const {
		clientIds,
		isGroupable,
		// isUngroupable,
		blocksSelection,
		groupingBlockName,
	} = useConvertToGroupButtonProps( selectedClientIds );

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

	// TODO: Add check that there is sticky support.
	// TODO: Check that we are at the root of the document.

	if ( ! isGroupable || ! canRemove || ! groupingBlockName || hasParents ) {
		return null;
	}

	// Allow converting a single template part to standard blocks.
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
