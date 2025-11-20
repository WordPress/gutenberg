/**
 * External dependencies
 */
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	Field,
	NormalizedField,
	Operator,
	Rules,
	SortDirection,
} from '../types';
import RenderFromElements from './utils/render-from-elements';
import {
	OPERATOR_IS,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_NOT,
} from '../constants';
import { getControl } from '../dataform-controls';
import hasElements from './utils/has-elements';
import getValueFromId from './utils/get-value-from-id';
import setValueFromId from './utils/set-value-from-id';
import getFilterBy from './utils/get-filter-by';

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	if ( field.hasElements ) {
		return <RenderFromElements item={ item } field={ field } />;
	}

	const value = field.getValue( { item } );

	if ( ! value || ! colord( value ).isValid() ) {
		return value;
	}

	// Render color with visual preview
	return (
		<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
			<div
				style={ {
					width: '16px',
					height: '16px',
					borderRadius: '50%',
					backgroundColor: value,
					border: '1px solid #ddd',
					flexShrink: 0,
				} }
			/>
			<span>{ value }</span>
		</div>
	);
}

export default function normalizeField< Item >(
	field: Field< Item >
): NormalizedField< Item > {
	const getValue = field.getValue || getValueFromId( field.id );
	const setValue = field.setValue || setValueFromId( field.id );

	const sort = ( valueA: any, valueB: any, direction: SortDirection ) => {
		// Convert colors to HSL for better sorting
		const colorA = colord( valueA );
		const colorB = colord( valueB );

		if ( ! colorA.isValid() && ! colorB.isValid() ) {
			return 0;
		}
		if ( ! colorA.isValid() ) {
			return direction === 'asc' ? 1 : -1;
		}
		if ( ! colorB.isValid() ) {
			return direction === 'asc' ? -1 : 1;
		}

		// Sort by hue, then saturation, then lightness
		const hslA = colorA.toHsl();
		const hslB = colorB.toHsl();

		if ( hslA.h !== hslB.h ) {
			return direction === 'asc' ? hslA.h - hslB.h : hslB.h - hslA.h;
		}
		if ( hslA.s !== hslB.s ) {
			return direction === 'asc' ? hslA.s - hslB.s : hslB.s - hslA.s;
		}
		return direction === 'asc' ? hslA.l - hslB.l : hslB.l - hslA.l;
	};

	const isValid: Rules< Item > = {
		elements: true,
		custom: ( item: any, normalizedField ) => {
			const value = normalizedField.getValue( { item } );

			if (
				! [ undefined, '', null ].includes( value ) &&
				! colord( value ).isValid()
			) {
				return __( 'Value must be a valid color.' );
			}

			return null;
		},
	};

	const defaultOperators: Operator[] = [ OPERATOR_IS_ANY, OPERATOR_IS_NONE ];

	const validOperators: Operator[] = [
		OPERATOR_IS,
		OPERATOR_IS_NOT,
		OPERATOR_IS_ANY,
		OPERATOR_IS_NONE,
	];

	return {
		id: field.id,
		type: 'color',
		label: field.label || field.id,
		header: field.header || field.label || field.id,
		description: field.description,
		placeholder: field.placeholder,
		getValue,
		setValue,
		elements: field.elements,
		getElements: field.getElements,
		hasElements: hasElements( field ),
		render: field.render ?? render,
		Edit: getControl( field, 'color' ),
		sort: field.sort ?? sort,
		isValid: {
			...isValid,
			...field.isValid,
		},
		isVisible: field.isVisible,
		enableSorting: field.enableSorting ?? true,
		enableGlobalSearch: field.enableGlobalSearch ?? false,
		enableHiding: field.enableHiding ?? true,
		readOnly: field.readOnly ?? false,
		filterBy: getFilterBy( field, defaultOperators, validOperators ),
		format: {},
	};
}
