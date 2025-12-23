/**
 * External dependencies
 */
import deepMerge from 'deepmerge';

/**
 * WordPress dependencies
 */
import {
	__experimentalSpacer as Spacer,
	Button,
	Modal,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useContext, useState, useMemo } from '@wordpress/element';
import { useFocusOnMount } from '@wordpress/compose';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type {
	Field,
	NormalizedForm,
	NormalizedFormField,
	NormalizedField,
} from '../../types';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
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
	field: NormalizedFormField;
	onChange: ( data: Partial< Item > ) => void;
	onClose: () => void;
	fieldLabel: string;
} ) {
	const { fields } = useContext( DataFormContext );
	const [ changes, setChanges ] = useState< Partial< Item > >( {} );
	const modalData = useMemo( () => {
		return deepMerge( data, changes, {
			arrayMerge: ( target, source ) => source,
		} );
	}, [ data, changes ] );

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

	const fieldsAsFieldType: Field< Item >[] = fields.map( ( f ) => ( {
		...f,
		Edit: f.Edit === null ? undefined : f.Edit,
		isValid: {
			required: f.isValid.required?.constraint,
			elements: f.isValid.elements?.constraint,
			min: f.isValid.min?.constraint,
			max: f.isValid.max?.constraint,
			pattern: f.isValid.pattern?.constraint,
			minLength: f.isValid.minLength?.constraint,
			maxLength: f.isValid.maxLength?.constraint,
		},
	} ) );
	const { validity } = useFormValidity( modalData, fieldsAsFieldType, form );

	const onApply = () => {
		onChange( changes );
		onClose();
	};

	const handleOnChange = ( newValue: Partial< Item > ) => {
		setChanges( ( prev ) =>
			deepMerge( prev, newValue, {
				arrayMerge: ( target, source ) => source,
			} )
		);
	};

	const focusOnMountRef = useFocusOnMount( 'firstInputElement' );

	return (
		<Modal
			className="dataforms-layouts-panel__modal"
			onRequestClose={ onClose }
			isFullScreen={ false }
			title={ fieldLabel }
			size="medium"
		>
			<div ref={ focusOnMountRef }>
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
							hideLabelFromVision={ form.fields.length < 2 }
							validity={ childFieldValidity }
						/>
					) }
				</DataFormLayout>
			</div>
			<Stack
				direction="row"
				className="dataforms-layouts-panel__modal-footer"
				gap="sm"
			>
				<Spacer style={ { flex: 1 } } />
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
			</Stack>
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
	onOpen,
}: {
	data: Item;
	field: NormalizedFormField;
	onChange: ( value: any ) => void;
	labelPosition: 'side' | 'top' | 'none';
	summaryFields: NormalizedField< Item >[];
	fieldDefinition: NormalizedField< Item >;
	onOpen?: () => void;
} ) {
	const [ isOpen, setIsOpen ] = useState( false );

	const fieldLabel = !! field.children ? field.label : fieldDefinition?.label;

	return (
		<>
			<SummaryButton
				summaryFields={ summaryFields }
				data={ data }
				labelPosition={ labelPosition }
				fieldLabel={ fieldLabel }
				disabled={ fieldDefinition.readOnly === true }
				onClick={ () => {
					if ( onOpen ) {
						onOpen();
					}
					setIsOpen( true );
				} }
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
