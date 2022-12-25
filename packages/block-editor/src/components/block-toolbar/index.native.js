/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import UngroupButton from '../ungroup-button';
import { store as blockEditorStore } from '../../store';

export default function BlockToolbar() {
	const { isSelected, isValidAndVisual } = useSelect( ( select ) => {
		const { getBlockMode, getSelectedBlockClientIds, isBlockValid } =
			select( blockEditorStore );
		const selectedBlockClientIds = getSelectedBlockClientIds();

		return {
			isSelected: selectedBlockClientIds.length > 0,
			isValidAndVisual:
				selectedBlockClientIds.length === 1
					? isBlockValid( selectedBlockClientIds[ 0 ] ) &&
					  getBlockMode( selectedBlockClientIds[ 0 ] ) === 'visual'
					: false,
		};
	}, [] );

	if ( ! isSelected ) {
		return null;
	}

	return (
		<>
			{ isValidAndVisual && (
				<>
					<UngroupButton />
					<BlockControls.Slot group="block" />
					<BlockControls.Slot />
					<BlockControls.Slot group="inline" />
					<BlockControls.Slot group="other" />
				</>
			) }
		</>
	);
}
