/**
 * Casts value as an error if it's not one.
 *
 * @param {*} error The value to cast.
 *
 * @return {Error} The cast error.
 */
export default function castError( error ) {
	if ( ! ( error instanceof Error ) ) {
		error = new Error( error );
	}

	return error;
}
