/**
 * Internal dependencies
 */
import type {
	FormField,
	NormalizedField,
	SimpleFormField,
	SummaryField,
} from '../types';
import { isCombinedField } from './is-combined-field';

/**
 * Extracts field IDs from various summary field formats.
 *
 * @param summary The summary field configuration.
 * @return Array of field IDs.
 */
function extractSummaryIds( summary: SummaryField ): string[] {
	if ( ! summary ) {
		return [];
	}

	if ( typeof summary === 'string' ) {
		return [ summary ];
	}

	if ( Array.isArray( summary ) ) {
		return summary.map( ( item ) =>
			typeof item === 'string' ? item : item.id
		);
	}

	// Single object with id and visibility
	if ( typeof summary === 'object' && 'id' in summary ) {
		return [ summary.id ];
	}

	return [];
}

export const getSummaryFields = < Item >(
	summaryField: SummaryField,
	field: FormField,
	fields: NormalizedField< Item >[]
): NormalizedField< Item >[] => {
	if ( ! isCombinedField( field ) ) {
		const fieldDef = fields.find( ( _field ) => _field.id === field.id );
		return fieldDef ? [ fieldDef ] : [];
	}

	// Use summary field(s) if specified for combined fields
	if ( summaryField ) {
		const summaryIds = extractSummaryIds( summaryField );
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
