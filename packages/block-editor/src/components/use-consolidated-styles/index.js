/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit';
import { store as blockEditorStore } from '../../store';

export default function useConsolidatedStyles() {
	const { name: blockName } = useBlockEditContext();
	const consolidatedStyles = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const consolidatedBlockStyles =
			getSettings().__experimentalStyles?.blocks || {};


		return consolidatedBlockStyles && consolidatedBlockStyles[ blockName ]
			? consolidatedBlockStyles[ blockName ]
			: null;
	}, [] );

	return consolidatedStyles;
}
