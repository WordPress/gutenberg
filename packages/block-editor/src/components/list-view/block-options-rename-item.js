/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';

import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import BlockSettingsMenuControls from '../block-settings-menu-controls';

function BlockOptionsRenameItem( { clientId, onClick } ) {
	return (
		<BlockSettingsMenuControls>
			{ ( { selectedClientIds, __unstableDisplayLocation } ) => {
				// Only enabled for single selections.
				const canRename =
					selectedClientIds.length === 1 &&
					clientId === selectedClientIds[ 0 ];

				// This check ensures
				// - the `BlockSettingsMenuControls` fill
				// doesn't render multiple times and also that it renders for
				// the block from which the menu was triggered.
				// - `Rename` only appears in the ListView options.
				// - `Rename` only appears for blocks that support renaming.
				if (
					__unstableDisplayLocation !== 'list-view' ||
					! canRename
				) {
					return null;
				}

				return (
					<MenuItem onClick={ onClick }>{ __( 'Rename' ) }</MenuItem>
				);
			} }
		</BlockSettingsMenuControls>
	);
}

export default BlockOptionsRenameItem;
