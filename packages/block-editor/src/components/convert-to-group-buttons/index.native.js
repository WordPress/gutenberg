/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { switchToBlockType } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useConvertToGroupButtonProps from './use-convert-to-group-button-props';

function useConvertToGroupButtons( {
	clientIds,
	onUngroup,
	blocksSelection,
	groupingBlockName,
} ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const onConvertToGroup = () => {
		// Activate the `transform` on the Grouping Block which does the conversion.
		const newBlocks = switchToBlockType(
			blocksSelection,
			groupingBlockName
		);
		if ( newBlocks ) {
			replaceBlocks( clientIds, newBlocks );
		}
	};

	const onConvertFromGroup = () => {
		let innerBlocks = blocksSelection[ 0 ].innerBlocks;
		if ( ! innerBlocks.length ) {
			return;
		}
		if ( onUngroup ) {
			innerBlocks = onUngroup(
				blocksSelection[ 0 ].attributes,
				blocksSelection[ 0 ].innerBlocks
			);
		}
		replaceBlocks( clientIds, innerBlocks );
	};

	return {
		group: {
			id: 'groupButtonOption',
			label: _x( 'Group', 'verb' ),
			value: 'groupButtonOption',
			onSelect: () => {
				onConvertToGroup();
				createSuccessNotice(
					// translators: displayed right after the block is grouped
					__( 'Block grouped' )
				);
			},
		},
		ungroup: {
			id: 'ungroupButtonOption',
			label: _x(
				'Ungroup',
				'Ungrouping blocks from within a grouping block back into individual blocks within the Editor'
			),
			value: 'ungroupButtonOption',
			onSelect: () => {
				onConvertFromGroup();
				createSuccessNotice(
					// translators: displayed right after the block is ungrouped.
					__( 'Block ungrouped' )
				);
			},
		},
	};
}

export { useConvertToGroupButtons, useConvertToGroupButtonProps };
