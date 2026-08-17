import type { NormalizedRules, FieldValidity } from '../../../types';
import type { ValidatedControlProps } from '../../validated-form-controls/types';

export default function getCustomValidity< Item >(
	isValid: NormalizedRules< Item >,
	validity: FieldValidity | undefined
): ValidatedControlProps[ 'customValidity' ] {
	let customValidity;
	if ( isValid?.required && validity?.required ) {
		// If the consumer provides a message for required,
		// use it instead of the native built-in message.
		customValidity = validity.required.message
			? {
					type: validity.required.type,
					message: validity.required.message,
			  }
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
