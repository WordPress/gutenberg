/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ReusableBlockConvertButton from './reusable-block-convert-button';
import ReusableBlocksManageButton from './reusable-blocks-manage-button';

export default function ReusableBlocksMenuItems( { rootClientId } ) {
	const clientIds = useSelect(
		( select ) => select( blockEditorStore ).getSelectedBlockClientIds(),
		[]
	);

	return (
		<>
			<ReusableBlockConvertButton
				clientIds={ clientIds }
				rootClientId={ rootClientId }
			/>
			{ clientIds.length === 1 && (
				<ReusableBlocksManageButton clientId={ clientIds[ 0 ] } />
			) }
		</>
	);
}
