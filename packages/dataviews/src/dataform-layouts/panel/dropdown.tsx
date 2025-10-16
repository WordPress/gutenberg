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
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type {
	FieldValidity,
	Form,
	FormField,
	FormValidity,
	NormalizedField,
} from '../../types';
import { DataFormLayout } from '../data-form-layout';
import { isCombinedField } from '../is-combined-field';
import { DEFAULT_LAYOUT } from '../normalize-form-fields';
import SummaryButton from './summary-button';

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
	data,
	field,
	onChange,
	validity,
	labelPosition = 'side',
	summaryFields,
	fieldDefinition,
	popoverAnchor,
}: {
	data: Item;
	field: FormField;
	onChange: ( value: any ) => void;
	validity?: FieldValidity;
	labelPosition: 'side' | 'top' | 'none';
	summaryFields: NormalizedField< Item >[];
	fieldDefinition: NormalizedField< Item >;
	popoverAnchor: HTMLElement | null;
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
	const formValidity = useMemo( (): FormValidity => {
		if ( validity === undefined ) {
			return undefined;
		}

		if ( isCombinedField( field ) ) {
			return validity?.children;
		}

		return { [ field.id ]: validity };
	}, [ validity, field ] );

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
				<SummaryButton
					summaryFields={ summaryFields }
					data={ data }
					labelPosition={ labelPosition }
					fieldLabel={ fieldLabel }
					disabled={ fieldDefinition.readOnly === true }
					onClick={ onToggle }
					aria-expanded={ isOpen }
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<>
					<DropdownHeader title={ fieldLabel } onClose={ onClose } />
					<DataFormLayout
						data={ data }
						form={ form }
						onChange={ onChange }
						validity={ formValidity }
					>
						{ ( FieldLayout, childField, childFieldValidity ) => (
							<FieldLayout
								key={ childField.id }
								data={ data }
								field={ childField }
								onChange={ onChange }
								hideLabelFromVision={
									( form?.fields ?? [] ).length < 2
								}
								validity={ childFieldValidity }
							/>
						) }
					</DataFormLayout>
				</>
			) }
		/>
	);
}

export default PanelDropdown;
