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
import { useMemo, useRef, useEffect } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type {
	FieldValidity,
	NormalizedForm,
	NormalizedFormField,
	FormValidity,
	NormalizedField,
} from '../../types';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
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
	summaryFields,
	fieldDefinition,
	popoverAnchor,
	onFieldClick,
}: {
	data: Item;
	field: NormalizedFormField;
	onChange: ( value: any ) => void;
	validity?: FieldValidity;
	summaryFields: NormalizedField< Item >[];
	fieldDefinition: NormalizedField< Item >;
	popoverAnchor: HTMLElement | null;
	onFieldClick?: ( handler: () => void ) => void;
} ) {
	const fieldLabel = !! field.children ? field.label : fieldDefinition?.label;
	const toggleRef = useRef< () => void >( () => {} );

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

	// Expose the toggle handler to the parent.
	useEffect( () => {
		if ( onFieldClick ) {
			onFieldClick( () => {
				if ( fieldDefinition.readOnly !== true ) {
					toggleRef.current();
				}
			} );
		}
	}, [ onFieldClick, fieldDefinition.readOnly ] );

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
			renderToggle={ ( { isOpen, onToggle } ) => {
				// Store the toggle handler in ref so it can be accessed from outside.
				toggleRef.current = onToggle;
				return (
					<SummaryButton
						summaryFields={ summaryFields }
						data={ data }
						fieldLabel={ fieldLabel }
						disabled={ fieldDefinition.readOnly === true }
						onClick={ onToggle }
						aria-expanded={ isOpen }
					/>
				);
			} }
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
