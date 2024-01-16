/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import { switchToBlockType } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useConvertToGroupButtonProps from './use-convert-to-group-button-props';
import BlockGroupToolbar from './toolbar';
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

/* TODO: check if this used in other legacy dropdown menus */
function ConvertToGroupButton( {
	clientIds,
	isGroupable,
	isUngroupable,
	onUngroup,
	blocksSelection,
	groupingBlockName,
} ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );
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

	if ( ! isGroupable && ! isUngroupable ) {
		return null;
	}

	return (
		<>
			{ isGroupable && (
				<DropdownMenuItem onClick={ onConvertToGroup }>
					<DropdownMenuItemLabel>
						{ _x( 'Group', 'verb' ) }
					</DropdownMenuItemLabel>
				</DropdownMenuItem>
			) }
			{ isUngroupable && (
				<DropdownMenuItem onClick={ onConvertFromGroup }>
					<DropdownMenuItemLabel>
						{ _x(
							'Ungroup',
							'Ungrouping blocks from within a grouping block back into individual blocks within the Editor '
						) }
					</DropdownMenuItemLabel>
				</DropdownMenuItem>
			) }
		</>
	);
}

export {
	BlockGroupToolbar,
	ConvertToGroupButton,
	useConvertToGroupButtonProps,
};
