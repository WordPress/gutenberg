/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

function usePatternsSetup( clientId, blockName, filterPatternsFn ) {
	const { patterns } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				__experimentalGetPatternsByBlockTypes,
				__experimentalGetAllowedPatterns,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			let _patterns;
			// TODO maybe support combination of scoped and provided function??
			if ( filterPatternsFn ) {
				_patterns = __experimentalGetAllowedPatterns(
					rootClientId
				).filter( filterPatternsFn );
			} else {
				_patterns = __experimentalGetPatternsByBlockTypes(
					blockName,
					rootClientId
				);
			}
			return { patterns: _patterns };
		},
		[ clientId, blockName, filterPatternsFn ]
	);

	return patterns;
}

export default usePatternsSetup;
