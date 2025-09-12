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
import { sprintf, __, _x } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { Form, FormField, NormalizedField } from '../../types';
import { DataFormLayout } from '../data-form-layout';
import { isCombinedField } from '../is-combined-field';
import { DEFAULT_LAYOUT } from '../../normalize-form-fields';

function DropdownHeader( {
	title,
	onClose,
}: {
	title?: string;
	onClose: () => void;
} ) {
	return (
		<VStack
			className="dataforms-layouts-panel__dropdown-header"
			spacing={ 4 }
		>
			<HStack alignment="center">
				{ title && (
					<Heading level={ 2 } size={ 13 }>
						{ title }
					</Heading>
				) }
				<Spacer />
				{ onClose && (
					<Button
						label={ __( 'Close' ) }
						icon={ closeSmall }
						onClick={ onClose }
						size="small"
					/>
				) }
			</HStack>
		</VStack>
	);
}

function PanelDropdown< Item >( {
	fieldDefinition,
	popoverAnchor,
	labelPosition = 'side',
	data,
	onChange,
	field,
}: {
	fieldDefinition: NormalizedField< Item >;
	popoverAnchor: HTMLElement | null;
	labelPosition: 'side' | 'top' | 'none';
	data: Item;
	onChange: ( value: any ) => void;
	field: FormField;
} ) {
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
					onClick={ onToggle }
					disabled={ fieldDefinition.readOnly === true }
					accessibleWhenDisabled
				>
					<fieldDefinition.render
						item={ data }
						field={ fieldDefinition }
					/>
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<>
					<DropdownHeader title={ fieldLabel } onClose={ onClose } />
					<DataFormLayout
						data={ data }
						form={ form }
						onChange={ onChange }
					>
						{ ( FieldLayout, nestedField ) => (
							<FieldLayout
								key={ nestedField.id }
								data={ data }
								field={ nestedField }
								onChange={ onChange }
								hideLabelFromVision={
									( form?.fields ?? [] ).length < 2
								}
							/>
						) }
					</DataFormLayout>
				</>
			) }
		/>
	);
}

export default PanelDropdown;
