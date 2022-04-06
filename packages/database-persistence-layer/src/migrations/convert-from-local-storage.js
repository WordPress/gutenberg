/**
 * Converts data from the old `@wordpress/data` package format.
 *
 * @param {number | string} userId
 *
 * @return {Object | undefined} The converted data or `undefined` if there was nothing to convert.
 */
export default function convertFromLocalStorage( userId ) {
	const key = `WP_DATA_USER_${ userId }`;
	const unparsedData = window.localStorage.getItem( key );
	const data = JSON.parse( unparsedData );
	return data?.[ 'core/preferences' ];
}
