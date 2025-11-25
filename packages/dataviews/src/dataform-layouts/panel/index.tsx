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
import { useState, useContext, useRef, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	FieldLayoutProps,
	NormalizedField,
	NormalizedFormField,
	NormalizedPanelLayout,
} from '../../types';
import DataFormContext from '../../components/dataform-context';
import PanelDropdown from './dropdown';
import PanelModal from './modal';
import { getSummaryFields } from '../get-summary-fields';

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

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState< HTMLElement | null >(
		null
	);

	// Store the click handler from child components.
	const clickHandlerRef = useRef< () => void >( () => {} );

	const handleFieldClick = useCallback( ( handler: () => void ) => {
		clickHandlerRef.current = handler;
	}, [] );

	// Handle clicks on the field wrapper.
	const onFieldWrapperClick = ( e: React.MouseEvent ) => {
		// Only trigger if not clicking on an interactive element.
		const target = e.target as HTMLElement;
		if (
			! target.closest( 'button' ) &&
			! target.closest( 'a' ) &&
			! target.closest( 'input' ) &&
			! target.closest( 'select' ) &&
			! target.closest( 'textarea' )
		) {
			clickHandlerRef.current();
		}
	};

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
	const fieldLabel = !! field.children ? field.label : fieldDefinition?.label;
	const fieldClassName = clsx( 'dataforms-layouts-panel__field', {
		'is-read-only': fieldDefinition.readOnly === true,
	} );

	const renderedControl =
		layout.openAs === 'modal' ? (
			<PanelModal
				data={ data }
				field={ field }
				onChange={ onChange }
				summaryFields={ summaryFields }
				fieldDefinition={ fieldDefinition }
				onFieldClick={ handleFieldClick }
			/>
		) : (
			<PanelDropdown
				data={ data }
				field={ field }
				onChange={ onChange }
				validity={ validity }
				summaryFields={ summaryFields }
				fieldDefinition={ fieldDefinition }
				popoverAnchor={ popoverAnchor }
				onFieldClick={ handleFieldClick }
			/>
		);

	if ( labelPosition === 'top' ) {
		return (
			<VStack
				className={ fieldClassName }
				spacing={ 0 }
				onClick={ onFieldWrapperClick }
			>
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
			// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
			<div className={ fieldClassName } onClick={ onFieldWrapperClick }>
				{ renderedControl }
			</div>
		);
	}

	// Defaults to label position side.
	return (
		<HStack
			ref={ setPopoverAnchor }
			className={ fieldClassName }
			onClick={ onFieldWrapperClick }
		>
			<div className={ labelClassName }>{ fieldLabel }</div>
			<div className="dataforms-layouts-panel__field-control">
				{ renderedControl }
			</div>
		</HStack>
	);
}
