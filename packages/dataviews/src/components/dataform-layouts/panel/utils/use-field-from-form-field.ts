/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
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
	const fieldDefinition = fields.find( ( _field ) => _field.id === field.id );

	if ( ! fieldDefinition ) {
		return fields.find( ( _field ) => {
			if ( !! field.children ) {
				const simpleChildren = field.children.filter(
					( child ) => ! child.children
				);

				if ( simpleChildren.length === 0 ) {
					return false;
				}

				return _field.id === simpleChildren[ 0 ].id;
			}

			return _field.id === field.id;
		} );
	}

	return fieldDefinition;
};

/**
 * Determines the field definition and summary fields for a panel layout.
 *
 * Summary fields are determined with the following priority:
 * 1. Use layout.summary fields if they exist
 * 2. Fall back to the field definition that matches the form field's id
 * 3. If the form field id doesn't exist, pick the first child field
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
