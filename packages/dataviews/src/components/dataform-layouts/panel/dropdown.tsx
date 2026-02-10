/**
 * WordPress dependencies
 */
import {
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
	Dropdown,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useContext, useMemo, useRef, useState } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';
import { __experimentalUseDialog as useDialog } from '@wordpress/compose';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type {
	FieldValidity,
	NormalizedForm,
	NormalizedFormField,
	NormalizedPanelLayout,
	FormValidity,
} from '../../../types';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
import SummaryButton from './summary-button';
import useReportValidity from '../../../hooks/use-report-validity';
import getFirstValidationError from './utils/get-first-validation-error';
import getFieldDefinitionAndSummaryFields from './utils/get-field-definition-and-summary-fields';
import DataFormContext from '../../dataform-context';
import getLabelClassName from './utils/get-label-classname';
import getLabelContent from './utils/get-label-content';

function DropdownHeader( {
	title,
	onClose,
}: {
	title?: string;
	onClose: () => void;
} ) {
	return (
		<Stack
			direction="column"
			className="dataforms-layouts-panel__dropdown-header"
			gap="lg"
		>
			<Stack direction="row" gap="sm" align="center">
				{ title && (
					<Heading level={ 2 } size={ 13 }>
						{ title }
					</Heading>
				) }
				<Spacer style={ { flex: 1 } } />
				{ onClose && (
					<Button
						label={ __( 'Close' ) }
						icon={ closeSmall }
						onClick={ onClose }
						size="small"
					/>
				) }
			</Stack>
		</Stack>
	);
}

function DropdownContentWithValidation( {
	touched,
	children,
}: {
	touched: boolean;
	children: React.ReactNode;
} ) {
	const ref = useRef< HTMLDivElement >( null );
	useReportValidity( ref, touched );
	return <div ref={ ref }>{ children }</div>;
}

function PanelDropdown< Item >( {
	data,
	field,
	onChange,
	validity,
}: {
	data: Item;
	field: NormalizedFormField;
	onChange: ( value: any ) => void;
	validity?: FieldValidity;
} ) {
	const [ touched, setTouched ] = useState( false );

	const { fields } = useContext( DataFormContext );
	const layout = field.layout as NormalizedPanelLayout;
	const labelPosition = layout.labelPosition;

	const { fieldDefinition, summaryFields } =
		getFieldDefinitionAndSummaryFields( layout, field, fields );

	const fieldLabel = !! field.children ? field.label : fieldDefinition?.label;

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState< HTMLElement | null >(
		null
	);

	const form: NormalizedForm = useMemo(
		() => ( {
			layout: DEFAULT_LAYOUT,
			fields: !! field.children
				? field.children
				: // If not explicit children return the field id itself.
				  [ { id: field.id, layout: DEFAULT_LAYOUT } ],
		} ),
		[ field ]
	);
	const formValidity = useMemo( (): FormValidity => {
		if ( validity === undefined ) {
			return undefined;
		}

		if ( !! field.children ) {
			return validity?.children;
		}

		return { [ field.id ]: validity };
	}, [ validity, field ] );

	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			placement: 'left-start',
			offset: 36,
			shift: true,
		} ),
		[ popoverAnchor ]
	);

	const [ dialogRef, dialogProps ] = useDialog( {
		focusOnMount: 'firstInputElement',
	} );

	if ( ! fieldDefinition ) {
		return null;
	}

	const errorMessage = getFirstValidationError( validity );
	const showError = touched && !! errorMessage;
	const labelClassName = getLabelClassName( labelPosition, showError );
	const labelContent = getLabelContent( showError, errorMessage, fieldLabel );

	return (
		<div
			ref={ setPopoverAnchor }
			className="dataforms-layouts-panel__field-dropdown-anchor"
		>
			<Dropdown
				contentClassName="dataforms-layouts-panel__field-dropdown"
				popoverProps={ popoverProps }
				focusOnMount={ false }
				onToggle={ ( willOpen ) => {
					if ( ! willOpen ) {
						setTouched( true );
					}
				} }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<SummaryButton
						summaryFields={ summaryFields }
						data={ data }
						labelPosition={ labelPosition }
						fieldLabel={ fieldLabel }
						disabled={ fieldDefinition.readOnly === true }
						onClick={ onToggle }
						aria-expanded={ isOpen }
						aria-haspopup="dialog"
						labelContent={ labelContent }
						labelClassName={ labelClassName }
						showError={ showError }
						errorMessage={ errorMessage }
					/>
				) }
				renderContent={ ( { onClose } ) => (
					<DropdownContentWithValidation touched={ touched }>
						<div ref={ dialogRef } { ...dialogProps }>
							<DropdownHeader
								title={ fieldLabel }
								onClose={ onClose }
							/>
							<DataFormLayout
								data={ data }
								form={ form }
								onChange={ onChange }
								validity={ formValidity }
							>
								{ (
									FieldLayout,
									childField,
									childFieldValidity,
									markWhenOptional
								) => (
									<FieldLayout
										key={ childField.id }
										data={ data }
										field={ childField }
										onChange={ onChange }
										hideLabelFromVision={
											( form?.fields ?? [] ).length < 2
										}
										markWhenOptional={ markWhenOptional }
										validity={ childFieldValidity }
									/>
								) }
							</DataFormLayout>
						</div>
					</DropdownContentWithValidation>
				) }
			/>
		</div>
	);
}

export default PanelDropdown;
