/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useEditorAssets } from './use-editor-assets';
import { unlock } from '../lock-unlock';

/**
 * Returns the unlocked private APIs from @wordpress/block-library
 * after editor assets have been dynamically loaded.
 *
 * block-library is loaded at runtime via useEditorAssets, so it cannot
 * be statically imported. This hook encapsulates the dynamic access.
 *
 * @return The unlocked block-library private APIs, or null if assets are not yet loaded.
 */
export function useBlockLibraryPrivateApis() {
	const { isReady } = useEditorAssets();

	return useMemo( () => {
		if ( ! isReady ) {
			return null;
		}
		const blockLibrary = (
			window as Window & {
				wp?: {
					blockLibrary?: {
						privateApis: Parameters< typeof unlock >[ 0 ];
					};
				};
			}
		).wp?.blockLibrary;
		if ( ! blockLibrary ) {
			return null;
		}
		return unlock( blockLibrary.privateApis );
	}, [ isReady ] );
}
