/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	Button,
	Modal,
} from '@wordpress/components';
import { __, sprintf, _x } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Form, FormField, NormalizedField } from '../../types';
import { DataFormLayout } from '../data-form-layout';
import { isCombinedField } from '../is-combined-field';
import { DEFAULT_LAYOUT } from '../../normalize-form-fields';

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

	const onApply = () => {
		onChange( changes );
		onClose();
	};

	const handleOnChange = ( value: Partial< Item > ) => {
		setChanges( ( prev ) => ( { ...prev, ...value } ) );
	};

	// Merge original data with local changes for display
	const displayData = { ...data, ...changes };

	return (
		<Modal
			className="dataforms-layouts-panel__modal"
			onRequestClose={ onClose }
			isFullScreen={ false }
			title={ fieldLabel }
			size="medium"
		>
			<DataFormLayout
				data={ displayData }
				form={ form }
				onChange={ handleOnChange }
			>
				{ ( FieldLayout, nestedField ) => (
					<FieldLayout
						key={ nestedField.id }
						data={ displayData }
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
	labelPosition,
	data,
	onChange,
	field,
}: {
	fieldDefinition: NormalizedField< Item >;
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
			<Button
				className="dataforms-layouts-modal__field-control"
				size="compact"
				variant={
					[ 'none', 'top' ].includes( labelPosition )
						? 'link'
						: 'tertiary'
				}
				aria-expanded={ isOpen }
				aria-label={ sprintf(
					// translators: %s: Field name.
					_x( 'Edit %s', 'field' ),
					fieldLabel || ''
				) }
				onClick={ () => setIsOpen( true ) }
				disabled={ fieldDefinition.readOnly === true }
				accessibleWhenDisabled
			>
				<fieldDefinition.render
					item={ data }
					field={ fieldDefinition }
				/>
			</Button>
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
