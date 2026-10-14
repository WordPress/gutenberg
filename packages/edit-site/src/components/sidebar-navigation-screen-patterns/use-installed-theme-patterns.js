import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { unlock } from '../../lock-unlock';

const EMPTY_ARRAY = [];

/**
 * Returns the installed themes, other than the active theme and its parent,
 * along with the patterns each one would add if it were activated.
 *
 * @return {{themes: Array, isResolving: boolean}} Themes with their patterns.
 */
export default function useInstalledThemePatterns() {
	const { installedThemes, patterns } = useSelect(
		( select ) => ( {
			installedThemes: select( coreStore ).getEntityRecords(
				'root',
				'theme'
			),
			patterns: unlock( select( coreStore ) ).getInstalledThemePatterns(),
		} ),
		[]
	);

	return useMemo( () => {
		if ( ! installedThemes || ! patterns ) {
			return { themes: EMPTY_ARRAY, isResolving: true };
		}
		const themes = installedThemes
			.map( ( theme ) => ( {
				stylesheet: theme.stylesheet,
				name: theme.name.raw,
				patterns: patterns.filter(
					( pattern ) =>
						pattern.theme === theme.stylesheet &&
						pattern.inserter !== false
				),
			} ) )
			.filter( ( theme ) => theme.patterns.length )
			.sort( ( a, b ) => a.name.localeCompare( b.name ) );
		return { themes, isResolving: false };
	}, [ installedThemes, patterns ] );
}
