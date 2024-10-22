/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import { filterOutDuplicatesByName } from './utils';

export default function usePatternSettings() {
	const storedSettings = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );
		return getSettings();
	}, [] );

	const settingsBlockPatterns =
		storedSettings.__experimentalAdditionalBlockPatterns ?? // WP 6.0
		storedSettings.__experimentalBlockPatterns; // WP 5.9

	const restBlockPatterns = useSelect(
		( select ) => select( coreStore ).getBlockPatterns(),
		[]
	);

	const blockPatterns = useMemo(
		() =>
			[
				...( settingsBlockPatterns || [] ),
				...( restBlockPatterns || [] ),
			].filter( filterOutDuplicatesByName ),
		[ settingsBlockPatterns, restBlockPatterns ]
	);

	const settings = useMemo( () => {
		const { __experimentalAdditionalBlockPatterns, ...restStoredSettings } =
			storedSettings;

		return {
			...restStoredSettings,
			__experimentalBlockPatterns: blockPatterns,
			isPreviewMode: true,
		};
	}, [ storedSettings, blockPatterns ] );

	return settings;
}
