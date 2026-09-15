import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';

function usePatternsSetup( clientId, blockName, filterPatternsFn ) {
	return useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getPatternsByBlockTypes,
				__experimentalGetAllowedPatterns,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			if ( filterPatternsFn ) {
				return __experimentalGetAllowedPatterns( rootClientId ).filter(
					filterPatternsFn
				);
			}
			return getPatternsByBlockTypes( blockName, rootClientId );
		},
		[ clientId, blockName, filterPatternsFn ]
	);
}

export default usePatternsSetup;
