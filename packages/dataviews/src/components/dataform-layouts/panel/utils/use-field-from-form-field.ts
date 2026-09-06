import { useContext } from '@wordpress/element';
import type {
	NormalizedFormField,
	NormalizedField,
	NormalizedPanelLayout,
} from '../../../../types';
import { getSummaryFields } from '../../get-summary-fields';
import DataFormContext from '../../../dataform-context';

const getFieldDefinition = < Item >(
	field: NormalizedFormField,
	fields: NormalizedField< Item >[]
) => {
	// A combined form field is a layout container, not a field: its id is
	// never resolved against the field definitions. Fall back to its first
	// leaf child so the panel has a definition for the summary and
	// `readOnly` state.
	if ( !! field.children ) {
		const simpleChildren = field.children.filter(
			( child ) => ! child.children
		);

		if ( simpleChildren.length === 0 ) {
			return undefined;
		}

		return fields.find(
			( _field ) => _field.id === simpleChildren[ 0 ].id
		);
	}

	return fields.find( ( _field ) => _field.id === field.id );
};

/**
 * Determines the field definition and summary fields for a panel layout.
 *
 * Summary fields are determined with the following priority:
 * 1. Use layout.summary fields if they exist
 * 2. For a leaf form field, fall back to its field definition
 * 3. For a combined form field, fall back to its first leaf child
 * 4. If no field definition is found, return empty summary fields
 *
 * @param field The form field to get definition for
 * @return Object containing fieldDefinition, fieldLabel, and summaryFields
 */
function useFieldFromFormField( field: NormalizedFormField ) {
	const { fields } = useContext( DataFormContext );
	const layout = field.layout as NormalizedPanelLayout;
	const summaryFields = getSummaryFields( layout.summary, fields );
	const fieldDefinition = getFieldDefinition( field, fields );
	const fieldLabel = !! field.children ? field.label : fieldDefinition?.label;

	if ( summaryFields.length === 0 ) {
		return {
			summaryFields: fieldDefinition ? [ fieldDefinition ] : [],
			fieldDefinition,
			fieldLabel,
		};
	}

	return {
		summaryFields,
		fieldDefinition,
		fieldLabel,
	};
}

export default useFieldFromFormField;
