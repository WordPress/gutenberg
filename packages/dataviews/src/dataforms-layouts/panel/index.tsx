/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
	Dropdown,
	Button,
} from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { normalizeFields } from '../../normalize-fields';
import type { DataFormProps, NormalizedField, Field } from '../../types';

interface FormFieldProps< Item > {
	data: Item;
	field: NormalizedField< Item >;
	onChange: ( value: any ) => void;
}

function DropdownHeader( {
	title,
	onClose,
}: {
	title: string;
	onClose: () => void;
} ) {
	return (
		<VStack
			className="dataforms-layouts-panel__dropdown-header"
			spacing={ 4 }
		>
			<HStack alignment="center">
				<Heading level={ 2 } size={ 13 }>
					{ title }
				</Heading>
				<Spacer />
				{ onClose && (
					<Button
						className="dataforms-layouts-panel__dropdown-header-action"
						label={ __( 'Close' ) }
						icon={ closeSmall }
						onClick={ onClose }
					/>
				) }
			</HStack>
		</VStack>
	);
}

function FormField< Item >( {
	data,
	field,
	onChange,
}: FormFieldProps< Item > ) {
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

	return (
		<HStack
			ref={ setPopoverAnchor }
			className="dataforms-layouts-panel__field"
		>
			<div className="dataforms-layouts-panel__field-label">
				{ field.label }
			</div>
			<div>
				<Dropdown
					contentClassName="dataforms-layouts-panel__field-dropdown"
					popoverProps={ popoverProps }
					focusOnMount
					toggleProps={ {
						size: 'compact',
						variant: 'tertiary',
						tooltipPosition: 'middle left',
					} }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
							className="dataforms-layouts-panel__field-control"
							size="compact"
							variant="tertiary"
							aria-expanded={ isOpen }
							aria-label={ sprintf(
								// translators: %s: Field name.
								__( 'Edit %s' ),
								field.label
							) }
							onClick={ onToggle }
						>
							<field.render item={ data } />
						</Button>
					) }
					renderContent={ ( { onClose } ) => (
						<>
							<DropdownHeader
								title={ field.label }
								onClose={ onClose }
							/>
							<field.Edit
								key={ field.id }
								data={ data }
								field={ field }
								onChange={ onChange }
								hideLabelFromVision
							/>
						</>
					) }
				/>
			</div>
		</HStack>
	);
}

export default function FormPanel< Item >( {
	data,
	fields,
	form,
	onChange,
}: DataFormProps< Item > ) {
	const visibleFields = useMemo(
		() =>
			normalizeFields(
				( form.fields ?? [] )
					.map( ( fieldId ) =>
						fields.find( ( { id } ) => id === fieldId )
					)
					.filter( ( field ): field is Field< Item > => !! field )
			),
		[ fields, form.fields ]
	);

	return (
		<VStack spacing={ 2 }>
			{ visibleFields.map( ( field ) => {
				return (
					<FormField
						key={ field.id }
						data={ data }
						field={ field }
						onChange={ onChange }
					/>
				);
			} ) }
		</VStack>
	);
}
