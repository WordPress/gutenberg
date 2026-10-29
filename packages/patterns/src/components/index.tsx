import {
	BlockSettingsMenuControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import PatternConvertButton from './pattern-convert-button';
import PatternsManageButton from './patterns-manage-button';
import type { PatternsMenuItemsProps } from './types';

function OptionsMenuPatternConvertButton( {
	rootClientId,
}: PatternsMenuItemsProps ) {
	const selectedClientIds = useSelect(
		( select ) => select( blockEditorStore ).getSelectedBlockClientIds(),
		[]
	);
	if ( ! selectedClientIds.length ) {
		return null;
	}
	return (
		<PatternConvertButton
			clientIds={ selectedClientIds }
			rootClientId={ rootClientId }
			closeBlockSettingsMenu={ () => {} }
			isOptionsMenuItem
		/>
	);
}

export default function PatternsMenuItems( {
	rootClientId,
}: PatternsMenuItemsProps ) {
	// The redesigned block toolbar offers Create pattern in its options menu.
	const isBlockToolbarRedesign = !! (
		window as { __experimentalBlockToolbarRedesign?: boolean }
	 ).__experimentalBlockToolbarRedesign;
	return (
		<>
			{ isBlockToolbarRedesign && (
				<OptionsMenuPatternConvertButton
					rootClientId={ rootClientId }
				/>
			) }
			<BlockSettingsMenuControls>
				{ ( { selectedClientIds, onClose } ) => (
					<>
						{ ! isBlockToolbarRedesign && (
							<PatternConvertButton
								clientIds={ selectedClientIds }
								rootClientId={ rootClientId }
								// The block settings menu passes `onClose` to its fills.
								closeBlockSettingsMenu={ onClose! }
							/>
						) }
						{ selectedClientIds.length === 1 && (
							<PatternsManageButton
								clientId={ selectedClientIds[ 0 ] }
								onClose={ onClose }
							/>
						) }
					</>
				) }
			</BlockSettingsMenuControls>
		</>
	);
}
