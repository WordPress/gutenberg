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
				__experimentalGetParsedPattern,
				__experimentalGetAllowedPatterns,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			let patterns = [];
			if ( filterPatternsFn ) {
				patterns = __experimentalGetAllowedPatterns(
					rootClientId
				).filter( filterPatternsFn );
			} else {
				patterns = __experimentalGetPatternsByBlockTypes(
					blockName,
					rootClientId
				);
			}
			return patterns.map( ( { name } ) =>
				__experimentalGetParsedPattern( name )
			);
		},
		[ clientId, blockName, filterPatternsFn ]
	);
}

export default usePatternsSetup;
