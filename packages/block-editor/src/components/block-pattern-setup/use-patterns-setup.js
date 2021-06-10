/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

function usePatternsSetup( clientId, blockName, filterPatternsFn ) {
	return useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				__experimentalGetPatternsByBlockTypes,
				__experimentalGetAllowedPatterns,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			if ( filterPatternsFn ) {
				return __experimentalGetAllowedPatterns( rootClientId ).filter(
					filterPatternsFn
				);
			}
			return __experimentalGetPatternsByBlockTypes(
				blockName,
				rootClientId
			);
		},
		[ clientId, blockName, filterPatternsFn ]
	);
}

export default usePatternsSetup;
