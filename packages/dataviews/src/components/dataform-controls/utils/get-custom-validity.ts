import type { ValidatedControlProps } from '@wordpress/components';
import type { NormalizedRules, FieldValidity } from '../../../types';

export default function getCustomValidity< Item >(
	isValid: NormalizedRules< Item >,
	validity: FieldValidity | undefined
): ValidatedControlProps[ 'customValidity' ] {
	let customValidity: ValidatedControlProps[ 'customValidity' ];
	if ( isValid?.required && validity?.required ) {
		// If the consumer provides a message for required,
		// use it instead of the native built-in message.
		// `FieldValidity.required.message` is optional, unlike every other
		// rule, so it has to be narrowed rather than passed straight through.
		const { message } = validity.required;
		customValidity = message
			? { ...validity.required, message }
			: undefined;
	} else if ( isValid?.pattern && validity?.pattern ) {
		customValidity = validity.pattern;
	} else if ( isValid?.min && validity?.min ) {
		customValidity = validity.min;
	} else if ( isValid?.max && validity?.max ) {
		customValidity = validity.max;
	} else if ( isValid?.minLength && validity?.minLength ) {
		customValidity = validity.minLength;
	} else if ( isValid?.maxLength && validity?.maxLength ) {
		customValidity = validity.maxLength;
	} else if ( isValid?.elements && validity?.elements ) {
		customValidity = validity.elements;
	} else if ( validity?.custom ) {
		customValidity = validity.custom;
	}

	return customValidity;
}
