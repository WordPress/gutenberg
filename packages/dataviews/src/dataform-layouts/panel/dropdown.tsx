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
import { useFocusOnMount } from '@wordpress/compose';

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
	labelPosition = 'side',
	summaryFields,
	fieldDefinition,
	popoverAnchor,
	onOpen,
}: {
	data: Item;
	field: NormalizedFormField;
	onChange: ( value: any ) => void;
	validity?: FieldValidity;
	labelPosition: 'side' | 'top' | 'none';
	summaryFields: NormalizedField< Item >[];
	fieldDefinition: NormalizedField< Item >;
	popoverAnchor: HTMLElement | null;
	onOpen?: () => void;
} ) {
	const fieldLabel = !! field.children ? field.label : fieldDefinition?.label;

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

	const focusOnMountRef = useFocusOnMount( 'firstInputElement' );

	return (
		<Dropdown
			contentClassName="dataforms-layouts-panel__field-dropdown"
			popoverProps={ popoverProps }
			focusOnMount={ false }
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
					onClick={ () => {
						if ( ! isOpen && onOpen ) {
							onOpen();
						}
						onToggle();
					} }
					aria-expanded={ isOpen }
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<>
					<DropdownHeader title={ fieldLabel } onClose={ onClose } />
					<div ref={ focusOnMountRef }>
						<DataFormLayout
							data={ data }
							form={ form }
							onChange={ onChange }
							validity={ formValidity }
						>
							{ (
								FieldLayout,
								childField,
								childFieldValidity
							) => (
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
					</div>
				</>
			) }
		/>
	);
}

export default PanelDropdown;
