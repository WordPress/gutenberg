import type { FieldValidity } from '../../../../types';

function getFirstValidationError(
	validity: FieldValidity | undefined
): string | undefined {
	if ( ! validity ) {
		return undefined;
	}

	const validityRules = Object.keys( validity ).filter(
		( key ) => key !== 'children'
	);

	for ( const key of validityRules ) {
		const rule = validity[ key as keyof Omit< FieldValidity, 'children' > ];
		if ( rule === undefined ) {
			continue;
		}

		if ( rule.type === 'invalid' ) {
			if ( rule.message ) {
				return rule.message;
			}

			// Provide default message for required validation (message is optional)
			if ( key === 'required' ) {
				return 'A required field is empty';
			}

			return 'Unidentified validation error';
		}
	}

	// Check children recursively
	if ( validity.children ) {
		for ( const childValidity of Object.values( validity.children ) ) {
			const childError = getFirstValidationError( childValidity );
			if ( childError ) {
				return childError;
			}
		}
	}

	return undefined;
}

export default getFirstValidationError;
