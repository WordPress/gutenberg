/**
 * Recursively flatten data passed to form data, to allow using multi-level objects.
 *
 * @param {FormData}      formData Form data object.
 * @param {string}        key      Key to amend to form data object
 * @param {string|Object} data     Data to be amended to form data.
 */
export function flattenFormData(
	formData: FormData,
	key: string,
	data: string | undefined | Record< string, string >
) {
	if (
		typeof data === 'object' &&
		Object.getPrototypeOf( data ) === Object.prototype
	) {
		for ( const name in data ) {
			if ( Object.prototype.hasOwnProperty.call( data, name ) ) {
				flattenFormData(
					formData,
					`${ key }[${ name }]`,
					data[ name ]
				);
			}
		}
	} else if ( data !== undefined ) {
		formData.append( key, String( data ) );
	}
}
