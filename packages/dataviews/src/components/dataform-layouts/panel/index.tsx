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
import type { FieldLayoutProps, NormalizedPanelLayout } from '../../../types';
import DataFormContext from '../../dataform-context';
import PanelModal from './modal';
import PanelDropdown from './dropdown';
import getFirstValidationError from './utils/get-first-validation-error';
import getFieldDefinitionAndSummaryFields from './utils/get-field-definition-and-summary-fields';

export default function FormPanelField< Item >( {
	data,
	field,
	onChange,
	validity,
}: FieldLayoutProps< Item > ) {
	const { fields } = useContext( DataFormContext );
	const layout = field.layout as NormalizedPanelLayout;
	const { fieldDefinition } = getFieldDefinitionAndSummaryFields(
		layout,
		field,
		fields
	);

	// Track if the panel has been closed (touched) to only show errors after interaction.
	const [ touched, setTouched ] = useState( false );
	const handleClose = () => setTouched( true );

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
				onClose={ handleClose }
				touched={ touched }
				labelContent={ labelContent }
				labelClassName={ labelClassName }
			/>
		);
	}

	return (
		<PanelDropdown
			data={ data }
			field={ field }
			onChange={ onChange }
			validity={ validity }
			onClose={ handleClose }
			touched={ touched }
			labelContent={ labelContent }
			labelClassName={ labelClassName }
		/>
	);
}
