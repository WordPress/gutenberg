/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useState, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	FieldLayoutProps,
	NormalizedPanelLayout,
	SimpleFormField,
} from '../../types';
import DataFormContext from '../../components/dataform-context';
import { isCombinedField } from '../is-combined-field';
import { normalizeLayout } from '../../normalize-form-fields';
import PanelDropdown from './dropdown';
import PanelModal from './modal';

export default function FormPanelField< Item >( {
	data,
	field,
	onChange,
}: FieldLayoutProps< Item > ) {
	const { fields } = useContext( DataFormContext );
	const fieldDefinition = fields.find( ( _field ) => {
		// Default to the first simple child if it is a combined field.
		if ( isCombinedField( field ) ) {
			const simpleChildren = field.children.filter(
				( child ): child is string | SimpleFormField =>
					typeof child === 'string' || ! isCombinedField( child )
			);

			if ( simpleChildren.length === 0 ) {
				return false;
			}

			const firstChildFieldId =
				typeof simpleChildren[ 0 ] === 'string'
					? simpleChildren[ 0 ]
					: simpleChildren[ 0 ].id;

			return _field.id === firstChildFieldId;
		}

		return _field.id === field.id;
	} );

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState< HTMLElement | null >(
		null
	);

	if ( ! fieldDefinition ) {
		return null;
	}

	const layout: NormalizedPanelLayout = normalizeLayout( {
		...field.layout,
		type: 'panel',
	} ) as NormalizedPanelLayout;

	const labelPosition = layout.labelPosition;
	const labelClassName = clsx(
		'dataforms-layouts-panel__field-label',
		`dataforms-layouts-panel__field-label--label-position-${ labelPosition }`
	);
	const fieldLabel = isCombinedField( field )
		? field.label
		: fieldDefinition?.label;

	const renderedControl =
		layout.openAs === 'modal' ? (
			<PanelModal
				field={ field }
				fieldDefinition={ fieldDefinition }
				data={ data }
				onChange={ onChange }
				labelPosition={ labelPosition }
			/>
		) : (
			<PanelDropdown
				field={ field }
				popoverAnchor={ popoverAnchor }
				fieldDefinition={ fieldDefinition }
				data={ data }
				onChange={ onChange }
				labelPosition={ labelPosition }
			/>
		);

	if ( labelPosition === 'top' ) {
		return (
			<VStack className="dataforms-layouts-panel__field" spacing={ 0 }>
				<div
					className={ labelClassName }
					style={ { paddingBottom: 0 } }
				>
					{ fieldLabel }
				</div>
				<div className="dataforms-layouts-panel__field-control">
					{ renderedControl }
				</div>
			</VStack>
		);
	}

	if ( labelPosition === 'none' ) {
		return (
			<div className="dataforms-layouts-panel__field">
				{ renderedControl }
			</div>
		);
	}

	// Defaults to label position side.
	return (
		<HStack
			ref={ setPopoverAnchor }
			className="dataforms-layouts-panel__field"
		>
			<div className={ labelClassName }>{ fieldLabel }</div>
			<div className="dataforms-layouts-panel__field-control">
				{ renderedControl }
			</div>
		</HStack>
	);
}
