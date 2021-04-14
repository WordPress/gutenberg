/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

function usePatternsSetup( blockName, filterPatternsFn ) {
	const { patterns } = useSelect(
		( select ) => {
			const {
				__experimentalGetPatternsByBlockTypes,
				__experimentalGetAllowedPatterns,
			} = select( blockEditorStore );
			let _patterns;
			// TODO maybe support combination of scoped and provided function??
			if ( filterPatternsFn ) {
				// TODO check rootClientId
				_patterns = __experimentalGetAllowedPatterns().filter(
					filterPatternsFn
				);
			} else {
				// TODO check and rootClientId
				_patterns = __experimentalGetPatternsByBlockTypes( blockName );
			}
			return { patterns: _patterns };
		},
		[ blockName ]
	);

	return patterns;
}

export default usePatternsSetup;
