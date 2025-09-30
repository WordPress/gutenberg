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
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Form, FormField, NormalizedField } from '../../types';
import { DataFormLayout } from '../data-form-layout';
import { isCombinedField } from '../is-combined-field';
import { DEFAULT_LAYOUT } from '../../normalize-form-fields';
import SummaryButton from './summary-button';

function ModalContent< Item >( {
	data,
	form,
	fieldLabel,
	onChange,
	onClose,
}: {
	data: Item;
	form: Form;
	fieldLabel: string;
	onChange: ( data: Partial< Item > ) => void;
	onClose: () => void;
} ) {
	const [ changes, setChanges ] = useState< Partial< Item > >( {} );
	const modalData = useMemo( () => {
		return deepMerge( data, changes );
	}, [ data, changes ] );

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
			>
				{ ( FieldLayout, nestedField ) => (
					<FieldLayout
						key={ nestedField.id }
						data={ modalData }
						field={ nestedField }
						onChange={ handleOnChange }
						hideLabelFromVision={
							( form?.fields ?? [] ).length < 2
						}
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
	fieldDefinition,
	summaryFields,
	labelPosition,
	data,
	onChange,
	field,
}: {
	fieldDefinition: NormalizedField< Item >;
	summaryFields: NormalizedField< Item >[];
	labelPosition: 'side' | 'top' | 'none';
	data: Item;
	onChange: ( value: any ) => void;
	field: FormField;
} ) {
	const [ isOpen, setIsOpen ] = useState( false );

	const fieldLabel = isCombinedField( field )
		? field.label
		: fieldDefinition?.label;

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
					form={ form as Form }
					fieldLabel={ fieldLabel ?? '' }
					onChange={ onChange }
					onClose={ () => setIsOpen( false ) }
				/>
			) }
		</>
	);
}

export default PanelModal;
