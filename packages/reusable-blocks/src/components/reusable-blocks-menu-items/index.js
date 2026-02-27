/**
 * WordPress dependencies
 */
import { BlockSettingsMenuControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ReusableBlockConvertButton from './reusable-block-convert-button';
import ReusableBlocksManageButton from './reusable-blocks-manage-button';

export default function ReusableBlocksMenuItems( { rootClientId } ) {
	return (
		<BlockSettingsMenuControls>
			{ ( { onClose, selectedClientIds } ) => (
				<>
					<ReusableBlockConvertButton
						clientIds={ selectedClientIds }
						rootClientId={ rootClientId }
						onClose={ onClose }
					/>
					{ selectedClientIds.length === 1 && (
						<ReusableBlocksManageButton
							clientId={ selectedClientIds[ 0 ] }
						/>
					) }
				</>
			) }
		</BlockSettingsMenuControls>
	);
}
