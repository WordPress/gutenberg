/**
 * External dependencies
 */
import deepMerge from 'deepmerge';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	Button,
	Modal,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useContext, useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Field, Form, FormField, NormalizedField } from '../../types';
import { DataFormLayout } from '../data-form-layout';
import { isCombinedField } from '../is-combined-field';
import { DEFAULT_LAYOUT } from '../normalize-form-fields';
import SummaryButton from './summary-button';
import useFormValidity from '../../hooks/use-form-validity';
import DataFormContext from '../../components/dataform-context';

function ModalContent< Item >( {
	data,
	field,
	onChange,
	fieldLabel,
	onClose,
}: {
	data: Item;
	field: FormField;
	onChange: ( data: Partial< Item > ) => void;
	onClose: () => void;
	fieldLabel: string;
} ) {
	const { fields } = useContext( DataFormContext );
	const [ changes, setChanges ] = useState< Partial< Item > >( {} );
	const modalData = useMemo( () => {
		return deepMerge( data, changes );
	}, [ data, changes ] );

	const form: Form = useMemo(
		(): Form => ( {
			layout: DEFAULT_LAYOUT,
			fields: isCombinedField( field )
				? field.children
				: // If not explicit children return the field id itself.
				  [ { id: field.id } ],
		} ),
		[ field ]
	);

	const { validity } = useFormValidity(
		modalData,
		fields as Field< any >[],
		form
	);

	const onApply = () => {
		onChange( changes );
		onClose();
	};

	const handleOnChange = ( newValue: Partial< Item > ) => {
		setChanges( ( prev ) => deepMerge( prev, newValue ) );
	};

	return (
		<Modal
			className="dataforms-layouts-panel__modal"
			onRequestClose={ onClose }
			isFullScreen={ false }
			title={ fieldLabel }
			size="medium"
		>
			<DataFormLayout
				data={ modalData }
				form={ form }
				onChange={ handleOnChange }
				validity={ validity }
			>
				{ ( FieldLayout, childField, childFieldValidity ) => (
					<FieldLayout
						key={ childField.id }
						data={ modalData }
						field={ childField }
						onChange={ handleOnChange }
						hideLabelFromVision={
							( form?.fields ?? [] ).length < 2
						}
						validity={ childFieldValidity }
					/>
				) }
			</DataFormLayout>
			<HStack
				className="dataforms-layouts-panel__modal-footer"
				spacing={ 3 }
			>
				<Spacer />
				<Button
					variant="tertiary"
					onClick={ onClose }
					__next40pxDefaultSize
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					variant="primary"
					onClick={ onApply }
					__next40pxDefaultSize
				>
					{ __( 'Apply' ) }
				</Button>
			</HStack>
		</Modal>
	);
}

function PanelModal< Item >( {
	data,
	field,
	onChange,
	labelPosition,
	summaryFields,
	fieldDefinition,
}: {
	data: Item;
	field: FormField;
	onChange: ( value: any ) => void;
	labelPosition: 'side' | 'top' | 'none';
	summaryFields: NormalizedField< Item >[];
	fieldDefinition: NormalizedField< Item >;
} ) {
	const [ isOpen, setIsOpen ] = useState( false );

	const fieldLabel = isCombinedField( field )
		? field.label
		: fieldDefinition?.label;

	return (
		<>
			<SummaryButton
				summaryFields={ summaryFields }
				data={ data }
				labelPosition={ labelPosition }
				fieldLabel={ fieldLabel }
				disabled={ fieldDefinition.readOnly === true }
				onClick={ () => setIsOpen( true ) }
				aria-expanded={ isOpen }
			/>
			{ isOpen && (
				<ModalContent
					data={ data }
					field={ field }
					onChange={ onChange }
					fieldLabel={ fieldLabel ?? '' }
					onClose={ () => setIsOpen( false ) }
				/>
			) }
		</>
	);
}

export default PanelModal;
