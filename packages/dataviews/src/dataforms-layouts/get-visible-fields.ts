/**
 * Internal dependencies
 */
import { normalizeCombinedFields } from '../normalize-fields';
import type {
	Field,
	CombinedFormField,
	NormalizedCombinedFormField,
} from '../types';

export function getVisibleFields(
	fields: Field< any >[],
	formFields: string[] = [],
	combinedFields?: CombinedFormField< any >[]
): Field< any >[] {
	const visibleFields: Array<
		Field< any > | NormalizedCombinedFormField< any >
	> = [ ...fields ];
	if ( combinedFields ) {
		visibleFields.push(
			...normalizeCombinedFields( combinedFields, fields )
		);
	}
	return formFields
		.map( ( fieldId ) =>
			visibleFields.find( ( { id } ) => id === fieldId )
		)
		.filter( ( field ): field is Field< any > => !! field );
}
