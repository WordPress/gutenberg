export async function fetchExternalMedia(
	options = {},
	category,
	abortController
) {
	const url = new URL( category.url );
	Object.entries( options ).forEach( ( [ key, value ] ) => {
		const queryKey = category.requestMap?.[ key ] || key;
		url.searchParams.set( queryKey, value );
	} );
	const response = await window.fetch( url, {
		// headers: [ [ 'Content-Type', 'application/json' ] ],
		signal: abortController?.signal,
	} );
	const jsonResponse = await response.json();
	const results = jsonResponse[ category.responseResults ] || jsonResponse;
	// For any external media we need to delete the `id` property if exists.
	// TODO: we probably need this for reporting purposes...
	return results.map( ( result ) => {
		delete result.id;
		return result;
	} );
}
