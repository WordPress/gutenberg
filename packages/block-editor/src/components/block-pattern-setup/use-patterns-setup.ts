import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import type { BlockPatternSetupProps, SetupPattern } from './types';

function usePatternsSetup(
	clientId: BlockPatternSetupProps[ 'clientId' ],
	blockName: BlockPatternSetupProps[ 'blockName' ],
	filterPatternsFn: BlockPatternSetupProps[ 'filterPatternsFn' ]
): SetupPattern[] {
	// The selectors return the patterns with their parsed blocks.
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
	) as SetupPattern[];
}

export default usePatternsSetup;
