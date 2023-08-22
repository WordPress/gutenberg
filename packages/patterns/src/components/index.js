/**
 * WordPress dependencies
 */
import { BlockSettingsMenuControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PatternConvertButton from './pattern-convert-button';
import PatternsManageButton from './patterns-manage-button';

export default function PatternsMenuItems( { rootClientId } ) {
	return (
		<BlockSettingsMenuControls>
			{ ( { selectedClientIds } ) => (
				<>
					<PatternConvertButton
						clientIds={ selectedClientIds }
						rootClientId={ rootClientId }
					/>
					{ selectedClientIds.length === 1 && (
						<PatternsManageButton
							clientId={ selectedClientIds[ 0 ] }
						/>
					) }
				</>
			) }
		</BlockSettingsMenuControls>
	);
}
