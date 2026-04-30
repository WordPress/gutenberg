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
import useMapFocusOnMount from '../../../hooks/use-map-focus-on-mount';
import useReportValidity from '../../../hooks/use-report-validity';
import DataFormContext from '../../dataform-context';
import useFieldFromFormField from './utils/use-field-from-form-field';

function PanelModalSession< Item >( {
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

	// Preserve the legacy `Modal.focusOnMount: 'firstInputElement'` behaviour
	// by mapping it onto Base UI's `initialFocus`. PanelModal opens to edit a
	// single field, so focusing the first input is a sensible default.
	const initialFocus = useMapFocusOnMount( 'firstInputElement', contentRef );

	return (
		<Dialog.Popup size="medium" initialFocus={ initialFocus }>
			<Dialog.Header>
				<Dialog.Title>{ fieldLabel }</Dialog.Title>
				<Dialog.CloseIcon />
			</Dialog.Header>
			<Dialog.Content ref={ contentRef }>
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
			</Dialog.Content>
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
	// `Dialog.Root` stays mounted across opens, so the session component
	// holding the in-progress `changes` state would also persist by default.
	// Bump `sessionKey` on `onOpenChangeComplete` (when the exit animation
	// finishes) to force-remount `<PanelModalSession>` between sessions —
	// this preserves the existing "Cancel/close always wipes the draft"
	// semantic without disturbing the form contents during the exit
	// animation itself.
	const [ sessionKey, setSessionKey ] = useState( 0 );

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
			<Dialog.Root
				open={ isOpen }
				onOpenChange={ ( open ) => {
					if ( ! open ) {
						handleClose();
					}
				} }
				onOpenChangeComplete={ ( open ) => {
					if ( ! open ) {
						setSessionKey( ( k ) => k + 1 );
					}
				} }
			>
				<PanelModalSession
					key={ sessionKey }
					data={ data }
					field={ field }
					onChange={ onChange }
					fieldLabel={ fieldLabel ?? '' }
					onClose={ handleClose }
					touched={ touched }
				/>
			</Dialog.Root>
		</>
	);
}

export default PanelModal;
