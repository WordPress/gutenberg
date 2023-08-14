/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PatternConvertButton from './pattern-convert-button';
import PatternsManageButton from './patterns-manage-button';

export default function PatternsMenuItems( { rootClientId } ) {
	const clientIds = useSelect(
		( select ) => select( blockEditorStore ).getSelectedBlockClientIds(),
		[]
	);

	return (
		<>
			<PatternConvertButton
				clientIds={ clientIds }
				rootClientId={ rootClientId }
			/>
			{ clientIds.length === 1 && (
				<PatternsManageButton clientId={ clientIds[ 0 ] } />
			) }
		</>
	);
}
