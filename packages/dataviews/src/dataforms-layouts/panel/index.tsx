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
	PanelLayout,
} from '../../types';
import DataFormContext from '../../components/dataform-context';
import { isCombinedField } from '../is-combined-field';
import { normalizeLayout } from '../../normalize-form-fields';
import PanelDropdown from './dropdown';
import PanelModal from './modal';
import { getSummaryFields } from '../get-summary-fields';

export default function FormPanelField< Item >( {
	data,
	field,
	onChange,
}: FieldLayoutProps< Item > ) {
	const { fields } = useContext( DataFormContext );

	const layout: NormalizedPanelLayout = normalizeLayout( {
		...( field.layout ?? {} ),
		type: 'panel',
	} as PanelLayout ) as NormalizedPanelLayout;

	const summaryFields = getSummaryFields( layout.summary, field, fields );
	const fieldDefinition = summaryFields[ 0 ]; // For backward compatibility

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState< HTMLElement | null >(
		null
	);

	if ( ! fieldDefinition ) {
		return null;
	}

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
				summaryFields={ summaryFields }
				data={ data }
				onChange={ onChange }
				labelPosition={ labelPosition }
			/>
		) : (
			<PanelDropdown
				field={ field }
				popoverAnchor={ popoverAnchor }
				fieldDefinition={ fieldDefinition }
				summaryFields={ summaryFields }
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
