/**
 * WordPress dependencies
 */
import { Dropdown } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { FieldLayoutProps, NormalizedField } from '../../../types';
import SummaryButton from './summary-button';
import useFieldFromFormField from './utils/use-field-from-form-field';
import PanelMenuContext from './context';

function PanelMenu< Item >( {
	data,
	field,
	onChange,
}: FieldLayoutProps< Item > ) {
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState< HTMLElement | null >(
		null
	);
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			anchor: popoverAnchor,
			placement: 'left-start' as const,
			offset: 36,
			shift: true,
		} ),
		[ popoverAnchor ]
	);

	const { fieldDefinition, fieldLabel, summaryFields } =
		useFieldFromFormField( field );

	if ( ! fieldDefinition || ! fieldDefinition.Edit ) {
		return null;
	}

	return (
		<div
			ref={ setPopoverAnchor }
			className="dataforms-layouts-panel__field-dropdown-anchor"
		>
			<Dropdown
				contentClassName="dataforms-layouts-panel__field-dropdown dataforms-layouts-panel__field-dropdown--menu"
				popoverProps={ popoverProps }
				focusOnMount="firstElement"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<SummaryButton
						data={ data }
						field={ field }
						fieldLabel={ fieldLabel }
						summaryFields={ summaryFields }
						touched={ false }
						disabled={ fieldDefinition.readOnly === true }
						onClick={ onToggle }
						aria-expanded={ isOpen }
						aria-haspopup="menu"
					/>
				) }
				renderContent={ ( { onClose } ) => (
					<MenuGroupContent
						data={ data }
						fieldDefinition={ fieldDefinition }
						onChange={ onChange }
						onClose={ onClose }
					/>
				) }
			/>
		</div>
	);
}

function MenuGroupContent< Item >( {
	data,
	fieldDefinition,
	onChange,
	onClose,
}: {
	data: Item;
	fieldDefinition: NormalizedField< Item >;
	onChange: FieldLayoutProps< Item >[ 'onChange' ];
	onClose: () => void;
} ) {
	const wrappedOnChange = useCallback(
		( value: any ) => {
			onChange( value );
			onClose();
		},
		[ onChange, onClose ]
	);

	const contextValue = useMemo( () => ( { onClose } ), [ onClose ] );

	// We know Edit is non-null because PanelMenu checks before rendering.
	const EditComponent = fieldDefinition.Edit!;

	return (
		<PanelMenuContext.Provider value={ contextValue }>
			<EditComponent
				data={ data }
				field={ fieldDefinition }
				onChange={ wrappedOnChange }
				hideLabelFromVision
			/>
		</PanelMenuContext.Provider>
	);
}

export default PanelMenu;
