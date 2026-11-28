import { store as coreStore } from '@wordpress/core-data';
import type { DataRegistry } from '@wordpress/data';

/**
 * The reading settings that the base data of the site mirrors.
 */
const READING_SETTINGS = [
	'show_on_front',
	'page_on_front',
	'page_for_posts',
] as const;

/**
 * Copies the saved reading settings into the base data of the site.
 *
 * The homepage and the posts page are saved to the `root/site` entity, while
 * `getHomePage()` and `getPostsPageId()` read them from `root/__unstableBase`,
 * which saving the settings doesn't update. Without this, whatever depends on
 * those selectors, such as the template field, keeps the previous pages until
 * the next load.
 *
 * Base data that isn't loaded yet is left alone: requesting it here fetches
 * it, and the response already holds the saved settings.
 *
 * @param registry      The data registry.
 * @param savedSettings The site settings the save responded with.
 */
export function syncSiteBase(
	registry: DataRegistry,
	savedSettings: Record< string, unknown > | undefined
) {
	if ( ! savedSettings ) {
		return;
	}
	const base = registry
		.select( coreStore )
		.getEntityRecord( 'root', '__unstableBase' );
	if ( ! base ) {
		return;
	}
	const readingSettings: Record< string, unknown > = {};
	for ( const setting of READING_SETTINGS ) {
		if ( setting in savedSettings ) {
			readingSettings[ setting ] = savedSettings[ setting ];
		}
	}
	registry
		.dispatch( coreStore )
		.receiveEntityRecords( 'root', '__unstableBase', {
			...base,
			...readingSettings,
		} );
}
