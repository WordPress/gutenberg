import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Returns whether the styles of a block are locked, which keeps its style
 * controls, in the Styles tab and in the block toolbar, from being changed.
 * Only applies with the block lock menu experiment.
 *
 * @param clientId The client ID of the block, if any.
 *
 * @return Whether the styles of the block are locked.
 */
export default function useIsStylesLocked( clientId?: string ): boolean {
	return useSelect(
		( select ) =>
			!! window.__experimentalBlockLockMenu &&
			!! clientId &&
			unlock( select( blockEditorStore ) ).isStylesLockedBlock(
				clientId
			),
		[ clientId ]
	);
}
