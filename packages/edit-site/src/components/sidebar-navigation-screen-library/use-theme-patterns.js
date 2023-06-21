/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	CORE_PATTERN_SOURCES,
	filterOutDuplicatesByName,
} from '../page-library/utils';
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

	const patterns = useMemo(
		() =>
			[ ...( blockPatterns || [] ), ...( restBlockPatterns || [] ) ]
				.filter(
					( pattern ) =>
						! CORE_PATTERN_SOURCES.includes( pattern.source )
				)
				.filter( filterOutDuplicatesByName ),
		[ blockPatterns, restBlockPatterns ]
	);

	return patterns;
}
