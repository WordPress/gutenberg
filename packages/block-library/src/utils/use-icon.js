import { useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Resolves an icon's SVG content from the WordPress Icon Registry.
 *
 * Fetches the icon via the core-data REST entity so that icons registered
 * server-side (including theme overrides) are available in the editor.
 *
 * @param {string} name The namespaced icon name (e.g. 'core/search').
 * @return {{ content: string, hasResolved: boolean }} The icon SVG content
 *   and resolution status.
 */
export function useIcon( name ) {
	const { record, hasResolved } = useSelect(
		( select ) => {
			if ( ! name ) {
				return { record: null, hasResolved: true };
			}
			const { getEntityRecord, hasFinishedResolution } =
				select( coreDataStore );
			return {
				record: getEntityRecord( 'root', 'icon', name ),
				hasResolved: hasFinishedResolution( 'getEntityRecord', [
					'root',
					'icon',
					name,
				] ),
			};
		},
		[ name ]
	);

	return {
		content: record?.content || '',
		hasResolved,
	};
}
