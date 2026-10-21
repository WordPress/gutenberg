import { BlockSettingsMenuControls } from '@wordpress/block-editor';
import PatternConvertButton from './pattern-convert-button';
import PatternsManageButton from './patterns-manage-button';
import type { PatternsMenuItemsProps } from './types';

export default function PatternsMenuItems( {
	rootClientId,
}: PatternsMenuItemsProps ) {
	return (
		<BlockSettingsMenuControls>
			{ ( { selectedClientIds, onClose } ) => (
				<>
					<PatternConvertButton
						clientIds={ selectedClientIds }
						rootClientId={ rootClientId }
						// The block settings menu passes `onClose` to its fills.
						closeBlockSettingsMenu={ onClose! }
					/>
					{ selectedClientIds.length === 1 && (
						<PatternsManageButton
							clientId={ selectedClientIds[ 0 ] }
							onClose={ onClose }
						/>
					) }
				</>
			) }
		</BlockSettingsMenuControls>
	);
}
