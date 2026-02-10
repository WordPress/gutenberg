/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { BaseControl, Icon, Tooltip } from '@wordpress/components';
import { useState, useContext } from '@wordpress/element';
import { error as errorIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type {
	FieldLayoutProps,
	NormalizedField,
	NormalizedFormField,
	NormalizedPanelLayout,
} from '../../../types';
import DataFormContext from '../../dataform-context';
import PanelDropdown from './dropdown';
import PanelModal from './modal';
import { getSummaryFields } from '../get-summary-fields';
import getFirstValidationError from './utils/get-first-validation-error';

const getFieldDefinition = < Item, >(
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
 * @param layout - The normalized panel layout configuration
 * @param field  - The form field to get definition for
 * @param fields - Array of normalized field definitions
 * @return Object containing fieldDefinition and summaryFields
 */
const getFieldDefinitionAndSummaryFields = < Item, >(
	layout: NormalizedPanelLayout,
	field: NormalizedFormField,
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
	const layout = field.layout as NormalizedPanelLayout;

	// Track if the panel has been closed (touched) to only show errors after interaction.
	const [ touched, setTouched ] = useState( false );
	const handleClose = () => setTouched( true );

	const { fieldDefinition, summaryFields } =
		getFieldDefinitionAndSummaryFields( layout, field, fields );

	if ( ! fieldDefinition ) {
		return null;
	}

	const labelPosition = layout.labelPosition;
	const errorMessage = getFirstValidationError( validity );
	const showError = touched && !! errorMessage;
	const labelClassName = clsx(
		'dataforms-layouts-panel__field-label',
		`dataforms-layouts-panel__field-label--label-position-${ labelPosition }`,
		{ 'has-error': showError }
	);
	const fieldLabel = !! field.children ? field.label : fieldDefinition?.label;

	const labelContent = showError ? (
		<Tooltip text={ errorMessage } placement="top">
			<span className="dataforms-layouts-panel__field-label-error-content">
				<Icon icon={ errorIcon } size={ 16 } />
				<BaseControl.VisualLabel>
					{ fieldLabel }
				</BaseControl.VisualLabel>
			</span>
		</Tooltip>
	) : (
		<BaseControl.VisualLabel>{ fieldLabel }</BaseControl.VisualLabel>
	);

	if ( layout.openAs === 'modal' ) {
		return (
			<PanelModal
				data={ data }
				field={ field }
				onChange={ onChange }
				validity={ validity }
				summaryFields={ summaryFields }
				fieldDefinition={ fieldDefinition }
				onClose={ handleClose }
				touched={ touched }
				labelContent={ labelContent }
				labelClassName={ labelClassName }
				showError={ showError }
			/>
		);
	}

	return (
		<PanelDropdown
			data={ data }
			field={ field }
			onChange={ onChange }
			validity={ validity }
			summaryFields={ summaryFields }
			fieldDefinition={ fieldDefinition }
			onClose={ handleClose }
			touched={ touched }
			labelContent={ labelContent }
			labelClassName={ labelClassName }
			showError={ showError }
		/>
	);
}
