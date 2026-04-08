/**
 * External dependencies
 */
import deepMerge from 'deepmerge';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useContext, useMemo, useRef, useState } from '@wordpress/element';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Dialog } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type {
	Field,
	NormalizedForm,
	NormalizedFormField,
	NormalizedPanelLayout,
	PanelOpenAsModal,
	FieldLayoutProps,
} from '../../../types';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
import SummaryButton from './summary-button';
import useFormValidity from '../../../hooks/use-form-validity';
import useReportValidity from '../../../hooks/use-report-validity';
import DataFormContext from '../../dataform-context';
import useFieldFromFormField from './utils/use-field-from-form-field';

function ModalContent< Item >( {
	data,
	field,
	onChange,
	fieldLabel,
	onClose,
	touched,
}: {
	data: Item;
	field: NormalizedFormField;
	onChange: ( data: Partial< Item > ) => void;
	onClose: () => void;
	fieldLabel: string;
	touched: boolean;
} ) {
	const { openAs } = field.layout as NormalizedPanelLayout;
	const { applyLabel, cancelLabel } = openAs as PanelOpenAsModal;
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

	const contentRef = useRef< HTMLDivElement >( null );

	// When the modal is opened after being previously closed (touched),
	// trigger reportValidity to show field-level errors.
	useReportValidity( contentRef, touched );

	return (
		<Dialog.Root
			open
			onOpenChange={ ( open ) => {
				if ( ! open ) {
					onClose();
				}
			} }
		>
			<Dialog.Popup size="medium">
				<Dialog.Header>
					<Dialog.Title>{ fieldLabel }</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>
				<div ref={ contentRef }>
					<DataFormLayout
						data={ modalData }
						form={ form }
						onChange={ handleOnChange }
						validity={ validity }
					>
						{ (
							FieldLayout,
							childField,
							childFieldValidity,
							markWhenOptional
						) => (
							<FieldLayout
								key={ childField.id }
								data={ modalData }
								field={ childField }
								onChange={ handleOnChange }
								hideLabelFromVision={ form.fields.length < 2 }
								markWhenOptional={ markWhenOptional }
								validity={ childFieldValidity }
							/>
						) }
					</DataFormLayout>
				</div>
				<Dialog.Footer>
					<Button
						variant="tertiary"
						onClick={ onClose }
						__next40pxDefaultSize
					>
						{ cancelLabel }
					</Button>
					<Button
						variant="primary"
						onClick={ onApply }
						__next40pxDefaultSize
					>
						{ applyLabel }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function PanelModal< Item >( {
	data,
	field,
	onChange,
	validity,
}: FieldLayoutProps< Item > ) {
	const [ touched, setTouched ] = useState( false );

	const [ isOpen, setIsOpen ] = useState( false );

	const { fieldDefinition, fieldLabel, summaryFields } =
		useFieldFromFormField( field );
	if ( ! fieldDefinition ) {
		return null;
	}

	const handleClose = () => {
		setIsOpen( false );
		setTouched( true );
	};

	return (
		<>
			<SummaryButton
				data={ data }
				field={ field }
				fieldLabel={ fieldLabel }
				summaryFields={ summaryFields }
				validity={ validity }
				touched={ touched }
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
					onClose={ handleClose }
					touched={ touched }
				/>
			) }
		</>
	);
}

export default PanelModal;
