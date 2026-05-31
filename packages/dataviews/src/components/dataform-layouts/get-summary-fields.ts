/**
 * Internal dependencies
 */
import type { NormalizedField, NormalizedSummaryField } from '../../types';

/**
 * Extracts field IDs from various summary field formats.
 *
 * @param summary The summary field configuration.
 * @return Array of field IDs.
 */
function extractSummaryIds( summary: NormalizedSummaryField ): string[] {
	if ( Array.isArray( summary ) ) {
		return summary.map( ( item ) =>
			typeof item === 'string' ? item : item.id
		);
	}

	return [];
}

/**
 * Returns the summary fields for a given field.
 * @param summaryField - The summary field configuration.
 * @param fields       - The fields to get the summary fields from.
 * @return The summary fields.
 */
export const getSummaryFields = < Item >(
	summaryField: NormalizedSummaryField,
	fields: NormalizedField< Item >[]
): NormalizedField< Item >[] => {
	if ( Array.isArray( summaryField ) && summaryField.length > 0 ) {
		const summaryIds = extractSummaryIds( summaryField );
		return summaryIds
			.map( ( summaryId ) =>
				fields.find( ( _field ) => _field.id === summaryId )
			)
			.filter( ( _field ) => _field !== undefined );
	}

	return [];
};
