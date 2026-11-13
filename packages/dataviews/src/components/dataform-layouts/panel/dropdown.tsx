import {
	__experimentalSpacer as Spacer,
	Button,
	Popover as WCPopover,
	SlotFillProvider,
} from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { useId, useMemo, useRef, useState } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';
import {
	useConstrainedTabbing,
	useFocusOnMount,
	useMergeRefs,
} from '@wordpress/compose';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Keep panel flyouts in the parent UI overlay's focus tree.
	Popover,
	Stack,
} from '@wordpress/ui';
import type {
	FieldLayoutProps,
	NormalizedForm,
	FormValidity,
} from '../../../types';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
import SummaryButton from './summary-button';
import useRevealValidity from '../../../hooks/use-reveal-validity';
import useFieldFromFormField from './utils/use-field-from-form-field';

function DropdownHeader( { title }: { title?: string } ) {
	return (
		<Stack
			direction="column"
			className="dataforms-layouts-panel__dropdown-header"
			gap="lg"
		>
			<Stack direction="row" gap="sm" align="center">
				<Popover.Title>{ title || __( 'Edit' ) }</Popover.Title>
				<Spacer style={ { flex: 1 } } />
				<Popover.Close
					render={
						<Button
							label={ __( 'Close' ) }
							icon={ closeSmall }
							size="small"
						/>
					}
				/>
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
	useRevealValidity( ref, touched );
	return (
		<div
			ref={ ref }
			className="dataforms-layouts-panel__field-dropdown-content"
		>
			{ children }
		</div>
	);
}

function PanelDropdown< Item >( {
	data,
	field,
	onChange,
	validity,
}: FieldLayoutProps< Item > ) {
	const legacyPopoverSlotName = useId();
	const [ touched, setTouched ] = useState( false );
	const [ isOpen, setIsOpen ] = useState( false );
	const constrainedTabbingRef = useConstrainedTabbing();
	const initialFocusRef = useFocusOnMount( 'firstInputElement' );
	const popupRef = useMergeRefs( [ constrainedTabbingRef, initialFocusRef ] );

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

	const { fieldDefinition, fieldLabel, summaryFields } =
		useFieldFromFormField( field );
	if ( ! fieldDefinition ) {
		return null;
	}
	const isDisabled =
		fieldDefinition.readOnly === true ||
		fieldDefinition.isDisabled( { item: data, field: fieldDefinition } );

	return (
		<div
			ref={ setPopoverAnchor }
			className="dataforms-layouts-panel__field-dropdown-anchor"
		>
			<Popover.Root
				open={ isOpen }
				onOpenChange={ ( willOpen ) => {
					setIsOpen( willOpen );
					if ( ! willOpen ) {
						setTouched( true );
					}
				} }
			>
				<SummaryButton
					data={ data }
					field={ field }
					fieldLabel={ fieldLabel }
					summaryFields={ summaryFields }
					validity={ validity }
					touched={ touched }
					disabled={ isDisabled }
					isOpen={ isOpen }
					renderButton={ ( button ) => (
						<Popover.Trigger render={ button } />
					) }
				/>
				<Popover.Popup
					ref={ popupRef }
					initialFocus={ false }
					className="dataforms-layouts-panel__field-dropdown"
					positioner={
						<Popover.Positioner
							anchor={ popoverAnchor }
							side={ isRTL() ? 'right' : 'left' }
							align="start"
							sideOffset={ 36 }
						/>
					}
				>
					<SlotFillProvider passthrough>
						<WCPopover.__unstableSlotNameProvider
							value={ legacyPopoverSlotName }
						>
							<DropdownContentWithValidation touched={ touched }>
								<DropdownHeader title={ fieldLabel } />
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
												( form?.fields ?? [] ).length <
												2
											}
											markWhenOptional={
												markWhenOptional
											}
											validity={ childFieldValidity }
										/>
									) }
								</DataFormLayout>
							</DropdownContentWithValidation>
						</WCPopover.__unstableSlotNameProvider>
						<WCPopover.Slot name={ legacyPopoverSlotName } />
					</SlotFillProvider>
				</Popover.Popup>
			</Popover.Root>
		</div>
	);
}

export default PanelDropdown;
