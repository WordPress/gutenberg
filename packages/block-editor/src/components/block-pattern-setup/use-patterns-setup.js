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
				__experimentalGetScopedBlockPatterns,
				// __experimentalGetAllowedPatterns,
				getSettings,
			} = select( blockEditorStore );
			let _patterns;
			// TODO maybe support combination of scoped and provided function??
			if ( filterPatternsFn ) {
				_patterns = getSettings().__experimentalBlockPatterns.filter(
					filterPatternsFn
				);
			} else {
				_patterns = __experimentalGetScopedBlockPatterns(
					'block',
					blockName
				);
			}
			return { patterns: _patterns };
		},
		[ blockName ]
	);

	return patterns;
}

export default usePatternsSetup;
