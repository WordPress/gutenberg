/**
 * Internal dependencies
 */
import type { FormField, NormalizedField, SimpleFormField } from '../types';
import { isCombinedField } from './is-combined-field';

export const getSummaryFields = < Item >(
	field: FormField,
	fields: NormalizedField< Item >[]
): NormalizedField< Item >[] => {
	if ( ! isCombinedField( field ) ) {
		const fieldDef = fields.find( ( _field ) => _field.id === field.id );
		return fieldDef ? [ fieldDef ] : [];
	}

	// Use summary field(s) if specified for combined fields
	if ( field.summary ) {
		const summaryIds = Array.isArray( field.summary )
			? field.summary
			: [ field.summary ];
		return summaryIds
			.map( ( summaryId ) =>
				fields.find( ( _field ) => _field.id === summaryId )
			)
			.filter( ( _field ) => _field !== undefined );
	}

	// Default to the first simple child
	const simpleChildren = field.children.filter(
		( child ): child is string | SimpleFormField =>
			typeof child === 'string' || ! isCombinedField( child )
	);

	if ( simpleChildren.length === 0 ) {
		return [];
	}

	const firstChildFieldId =
		typeof simpleChildren[ 0 ] === 'string'
			? simpleChildren[ 0 ]
			: simpleChildren[ 0 ].id;

	const fieldDef = fields.find(
		( _field ) => _field.id === firstChildFieldId
	);
	return fieldDef ? [ fieldDef ] : [];
};
