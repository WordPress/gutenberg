import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { filterOutDuplicatesByName } from '../page-patterns/utils';
import { selectInstalledThemePatterns } from '../page-patterns/use-patterns';
import { EXCLUDED_PATTERN_SOURCES } from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

export default function useThemePatterns() {
	const blockPatterns = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );

		return (
			getSettings().__experimentalAdditionalBlockPatterns ??
			getSettings().__experimentalBlockPatterns
		);
	} );

	const restBlockPatterns = useSelect( ( select ) =>
		select( coreStore ).getBlockPatterns()
	);

	const installedThemePatterns = useSelect(
		( select ) => selectInstalledThemePatterns( select ).patterns,
		[]
	);

	const patterns = useMemo(
		() =>
			[
				...( blockPatterns || [] ),
				...( restBlockPatterns || [] ),
				...installedThemePatterns,
			]
				.filter(
					( pattern ) =>
						! EXCLUDED_PATTERN_SOURCES.includes( pattern.source )
				)
				.filter( filterOutDuplicatesByName )
				.filter( ( pattern ) => pattern.inserter !== false ),
		[ blockPatterns, restBlockPatterns, installedThemePatterns ]
	);

	return patterns;
}
