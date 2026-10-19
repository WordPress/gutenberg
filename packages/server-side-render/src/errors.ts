export function parseErrorMessage( error: any ): string {
	// Look for expectable validation errors before moving to generic handling

	// Are the attributes of a server-rendered block failing the validation
	// callback of WP_REST_Block_Renderer_Controller?
	//
	// @example
	// {
	//     "code": "rest_invalid_param",
	//     "message": "Invalid parameter(s): attributes",
	//     "data": {
	//         "status": 400,
	//         "params": {
	//             "attributes": "[test][1] is not one of Option1, Option2, and Option3."
	//         },
	//         "details": {
	//             "attributes": {
	//                 "code": "rest_not_in_enum",
	//                 "message": "[test][1] is not one of Option1, Option2, and Option3.",
	//                 "data": null
	//             }
	//         }
	//     }
	// }
	if (
		error?.code === 'rest_invalid_param' &&
		error.data?.params?.attributes &&
		1 === Object.values( error.data.params ).length
	) {
		return `Invalid attribute: ${ error.data.params.attributes }`;
	}

	if ( error instanceof Error ) {
		return error.message;
	}

	// Expect certain errors to be plain objects with a `message`
	// property, such as those thrown by `apiFetch`. Otherwise, do our
	// best to infer a message via duck typing.
	if ( ! error ) {
		return '';
	} else if ( typeof error.message === 'string' ) {
		return error.message;
	} else if ( typeof error === 'string' ) {
		return error;
	} else if (
		// Only consider own method, lest we erroneously end up calling
		// `Object#toString` at the end of the prototype chain, thereby
		// returning `"[object Object]"`.
		Object.hasOwn( error, 'toString' ) &&
		typeof error.toString === 'function'
	) {
		const result = error.toString();
		if ( typeof result === 'string' ) {
			return result;
		}
	}

	return '';
}
