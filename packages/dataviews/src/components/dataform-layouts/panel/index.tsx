/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Icon, Tooltip } from '@wordpress/components';
import { useState, useContext } from '@wordpress/element';
import { error as errorIcon } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type {
	FieldLayoutProps,
	FieldValidity,
	NormalizedField,
	NormalizedFormField,
	NormalizedPanelLayout,
} from '../../../types';
import DataFormContext from '../../dataform-context';
import PanelDropdown from './dropdown';
import PanelModal from './modal';
import { getSummaryFields } from '../get-summary-fields';

function getFirstValidationError(
	validity: FieldValidity | undefined
): string | undefined {
	if ( ! validity ) {
		return undefined;
	}

	const validityRules = Object.keys( validity ).filter(
		( key ) => key !== 'children'
	);

	for ( const key of validityRules ) {
		const rule = validity[ key as keyof Omit< FieldValidity, 'children' > ];
		if ( rule === undefined ) {
			continue;
		}

		if ( rule.type === 'invalid' ) {
			if ( rule.message ) {
				return rule.message;
			}

			// Provide default message for required validation (message is optional)
			if ( key === 'required' ) {
				return 'A required field is empty';
			}

			return 'Unidentified validation error';
		}
	}

	// Check children recursively
	if ( validity.children ) {
		for ( const childValidity of Object.values( validity.children ) ) {
			const childError = getFirstValidationError( childValidity );
			if ( childError ) {
				return childError;
			}
		}
	}

	return undefined;
}

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

	// Track if the panel has been opened (touched) to only show errors after interaction.
	const [ touched, setTouched ] = useState( false );
	const handleOpen = () => setTouched( true );

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
			<Stack
				direction="row"
				gap="xs"
				className="dataforms-layouts-panel__field-label-error-content"
				justify="flex-start"
			>
				<Icon icon={ errorIcon } size={ 16 } />
				<>{ fieldLabel }</>
			</Stack>
		</Tooltip>
	) : (
		fieldLabel
	);

	const renderedControl =
		layout.openAs === 'modal' ? (
			<PanelModal
				data={ data }
				field={ field }
				onChange={ onChange }
				labelPosition={ labelPosition }
				summaryFields={ summaryFields }
				fieldDefinition={ fieldDefinition }
				onOpen={ handleOpen }
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
				onOpen={ handleOpen }
			/>
		);

	if ( labelPosition === 'top' ) {
		return (
			<Stack
				direction="column"
				className="dataforms-layouts-panel__field"
			>
				<div
					className={ labelClassName }
					style={ { paddingBottom: 0 } }
				>
					{ labelContent }
				</div>
				<div className="dataforms-layouts-panel__field-control">
					{ renderedControl }
				</div>
			</Stack>
		);
	}

	if ( labelPosition === 'none' ) {
		return (
			<Stack
				direction="row"
				gap="xs"
				className="dataforms-layouts-panel__field dataforms-layouts-panel__field--label-position-none"
			>
				{ showError && (
					<Tooltip text={ errorMessage } placement="top">
						<Icon
							className="dataforms-layouts-panel__field-label-error-content"
							icon={ errorIcon }
							size={ 16 }
						/>
					</Tooltip>
				) }
				<div className="dataforms-layouts-panel__field-control">
					{ renderedControl }
				</div>
			</Stack>
		);
	}

	// Defaults to label position side.
	return (
		<Stack
			direction="row"
			gap="xs"
			ref={ setPopoverAnchor }
			className="dataforms-layouts-panel__field"
		>
			<div className={ labelClassName }>{ labelContent }</div>
			<div className="dataforms-layouts-panel__field-control">
				{ renderedControl }
			</div>
		</Stack>
	);
}
