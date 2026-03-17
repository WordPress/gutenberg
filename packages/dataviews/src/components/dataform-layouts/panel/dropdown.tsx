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
import { useMemo, useRef, useState } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';
import { __experimentalUseDialog as useDialog } from '@wordpress/compose';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type {
	FieldLayoutProps,
	NormalizedForm,
	FormValidity,
} from '../../../types';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
import SummaryButton from './summary-button';
import useReportValidity from '../../../hooks/use-report-validity';
import useFieldFromFormField from './utils/use-field-from-form-field';

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
}: FieldLayoutProps< Item > ) {
	const [ touched, setTouched ] = useState( false );

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState< HTMLElement | null >(
		null
	);
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
						data={ data }
						field={ field }
						fieldLabel={ fieldLabel }
						summaryFields={ summaryFields }
						validity={ validity }
						touched={ touched }
						disabled={ fieldDefinition.readOnly === true }
						onClick={ onToggle }
						aria-expanded={ isOpen }
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
