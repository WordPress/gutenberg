/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';

export default function useLibrarySettings() {
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
			].filter(
				( x, index, arr ) =>
					index === arr.findIndex( ( y ) => x.name === y.name )
			),
		[ ( settingsBlockPatterns, restBlockPatterns ) ]
	);

	const settings = useMemo( () => {
		const { __experimentalAdditionalBlockPatterns, ...restStoredSettings } =
			storedSettings;

		return {
			...restStoredSettings,
			__experimentalBlockPatterns: blockPatterns,
			__unstableIsPreviewMode: true,
		};
	}, [ storedSettings, blockPatterns ] );

	return settings;
}
