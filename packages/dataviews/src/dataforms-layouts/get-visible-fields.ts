/**
 * Internal dependencies
 */
import { normalizeCombinedFields } from '../normalize-fields';
import type {
	Field,
	CombinedFormField,
	NormalizedCombinedFormField,
} from '../types';

export function getVisibleFields< Item >(
	fields: Field< Item >[],
	formFields: string[] = [],
	combinedFields?: CombinedFormField< Item >[]
): Field< Item >[] {
	const visibleFields: Array<
		Field< Item > | NormalizedCombinedFormField< Item >
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
		.filter( ( field ): field is Field< Item > => !! field );
}
