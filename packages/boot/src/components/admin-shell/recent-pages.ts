/*
 * The pages this browser opened most recently, newest first. The shell uses
 * it to decide which pages to fetch ahead of time.
 */

const RECENT_PAGES_KEY = 'wp-boot-admin-shell-recent-pages';
const MAX_RECENT_PAGES = 20;

export function getRecentPages(): string[] {
	try {
		const value = JSON.parse(
			window.localStorage.getItem( RECENT_PAGES_KEY ) ?? '[]'
		);
		return Array.isArray( value )
			? value.filter( ( key ) => typeof key === 'string' )
			: [];
	} catch {
		return [];
	}
}

export function addRecentPage( pageKey: string ) {
	const pages = [
		pageKey,
		...getRecentPages().filter( ( key ) => key !== pageKey ),
	].slice( 0, MAX_RECENT_PAGES );
	try {
		window.localStorage.setItem(
			RECENT_PAGES_KEY,
			JSON.stringify( pages )
		);
	} catch {
		// Storage can be full or unavailable; fetching ahead is optional.
	}
}
