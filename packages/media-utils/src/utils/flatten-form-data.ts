/**
 * Determines whether the passed argument appears to be a plain object.
 *
 * @param data The object to inspect.
 */
function isPlainObject( data: unknown ): data is Record< string, unknown > {
	return (
		data !== null &&
		typeof data === 'object' &&
		Object.getPrototypeOf( data ) === Object.prototype
	);
}

/**
 * Recursively flatten data passed to form data, to allow using multi-level objects.
 *
 * @param formData Form data object.
 * @param key      Key to amend to form data object.
 * @param data     Data to be amended to form data.
 */
export function flattenFormData(
	formData: FormData,
	key: string,
	data: unknown
) {
	if ( Array.isArray( data ) || isPlainObject( data ) ) {
		for ( const [ name, value ] of Object.entries( data ) ) {
			flattenFormData( formData, `${ key }[${ name }]`, value );
		}
	} else if ( data !== undefined ) {
		formData.append( key, String( data ) );
	}
}
