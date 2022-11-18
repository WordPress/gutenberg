/**
 * Internal dependencies
 */
import BlockModeToggle from './block-mode-toggle';
import { useBlockSettingsContext } from './block-settings-dropdown';

export function BlockModeMenuItem( { onClose } ) {
	const { blockClientIds } = useBlockSettingsContext();
	const firstBlockClientId = blockClientIds[ 0 ];

	if ( blockClientIds?.length !== 1 ) {
		return null;
	}

	return (
		<BlockModeToggle clientId={ firstBlockClientId } onToggle={ onClose } />
	);
}
