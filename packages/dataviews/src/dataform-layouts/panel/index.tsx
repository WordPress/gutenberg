/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useState, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	FieldLayoutProps,
	FormField,
	NormalizedField,
	NormalizedPanelLayout,
	PanelLayout,
	SimpleFormField,
} from '../../types';
import DataFormContext from '../../components/dataform-context';
import { isCombinedField } from '../is-combined-field';
import { normalizeLayout } from '../normalize-form-fields';
import PanelDropdown from './dropdown';
import PanelModal from './modal';
import { getSummaryFields } from '../get-summary-fields';

const getFieldDefinition = < Item, >(
	field: FormField,
	fields: NormalizedField< Item >[]
) => {
	const fieldDefinition = fields.find( ( _field ) => _field.id === field.id );

	if ( ! fieldDefinition ) {
		return fields.find( ( _field ) => {
			if ( isCombinedField( field ) ) {
				const simpleChildren = field.children.filter(
					( child ): child is string | SimpleFormField =>
						typeof child === 'string' || ! isCombinedField( child )
				);

				if ( simpleChildren.length === 0 ) {
					return false;
				}

				const firstChildFieldId =
					typeof simpleChildren[ 0 ] === 'string'
						? simpleChildren[ 0 ]
						: simpleChildren[ 0 ].id;

				return _field.id === firstChildFieldId;
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
 * @param layout - The normalized panel layout configuration
 * @param field  - The form field to get definition for
 * @param fields - Array of normalized field definitions
 * @return Object containing fieldDefinition and summaryFields
 */
const getFieldDefinitionAndSummaryFields = < Item, >(
	layout: NormalizedPanelLayout,
	field: FormField,
	fields: NormalizedField< Item >[]
) => {
	const summaryFields = getSummaryFields( layout.summary, fields );
	const fieldDefinition = getFieldDefinition( field, fields );

	if ( summaryFields.length === 0 ) {
		return {
			summaryFields: fieldDefinition ? [ fieldDefinition ] : [],
			fieldDefinition,
		};
	}

	return {
		summaryFields,
		fieldDefinition,
	};
};

export default function FormPanelField< Item >( {
	data,
	field,
	onChange,
	validity,
}: FieldLayoutProps< Item > ) {
	const { fields } = useContext( DataFormContext );

	const layout: NormalizedPanelLayout = normalizeLayout( {
		...field.layout,
		type: 'panel',
	} as PanelLayout ) as NormalizedPanelLayout;

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState< HTMLElement | null >(
		null
	);

	const { fieldDefinition, summaryFields } =
		getFieldDefinitionAndSummaryFields( layout, field, fields );

	if ( ! fieldDefinition ) {
		return null;
	}

	const labelPosition = layout.labelPosition;
	const labelClassName = clsx(
		'dataforms-layouts-panel__field-label',
		`dataforms-layouts-panel__field-label--label-position-${ labelPosition }`
	);
	const fieldLabel = isCombinedField( field )
		? field.label
		: fieldDefinition?.label;

	const renderedControl =
		layout.openAs === 'modal' ? (
			<PanelModal
				data={ data }
				field={ field }
				onChange={ onChange }
				labelPosition={ labelPosition }
				summaryFields={ summaryFields }
				fieldDefinition={ fieldDefinition }
			/>
		) : (
			<PanelDropdown
				data={ data }
				field={ field }
				onChange={ onChange }
				validity={ validity }
				labelPosition={ labelPosition }
				summaryFields={ summaryFields }
				fieldDefinition={ fieldDefinition }
				popoverAnchor={ popoverAnchor }
			/>
		);

	if ( labelPosition === 'top' ) {
		return (
			<VStack className="dataforms-layouts-panel__field" spacing={ 0 }>
				<div
					className={ labelClassName }
					style={ { paddingBottom: 0 } }
				>
					{ fieldLabel }
				</div>
				<div className="dataforms-layouts-panel__field-control">
					{ renderedControl }
				</div>
			</VStack>
		);
	}

	if ( labelPosition === 'none' ) {
		return (
			<div className="dataforms-layouts-panel__field">
				{ renderedControl }
			</div>
		);
	}

	// Defaults to label position side.
	return (
		<HStack
			ref={ setPopoverAnchor }
			className="dataforms-layouts-panel__field"
		>
			<div className={ labelClassName }>{ fieldLabel }</div>
			<div className="dataforms-layouts-panel__field-control">
				{ renderedControl }
			</div>
		</HStack>
	);
}
