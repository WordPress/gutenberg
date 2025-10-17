/**
 * Internal dependencies
 */
import type { Rules, FieldValidity } from '../../types';

export default function getCustomValidity< Item >(
	isValid: Rules< Item >,
	validity: FieldValidity | undefined
) {
	let customValidity;
	if ( isValid?.required && validity?.required ) {
		// If the consumer provides a message for required,
		// use it instead of the native built-in message.
		customValidity = validity?.required?.message
			? validity.required
			: undefined;
	} else if ( isValid?.elements && validity?.elements ) {
		customValidity = validity.elements;
	} else if ( validity?.custom ) {
		customValidity = validity.custom;
	}

	return customValidity;
}
