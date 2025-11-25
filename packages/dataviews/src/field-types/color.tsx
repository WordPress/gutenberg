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
import type { DataViewRenderFieldProps, Rules, SortDirection } from '../types';
import type { FieldType } from '../types/private';
import RenderFromElements from './utils/render-from-elements';
import {
	OPERATOR_IS,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_NOT,
} from '../constants';

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

const isValid: Rules< any > = {
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

const sort = ( a: any, b: any, direction: SortDirection ) => {
	// Convert colors to HSL for better sorting
	const colorA = colord( a );
	const colorB = colord( b );

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

export default {
	type: 'color',
	render,
	Edit: 'color',
	sort,
	isValid,
	enableSorting: true,
	enableGlobalSearch: false,
	defaultOperators: [ OPERATOR_IS_ANY, OPERATOR_IS_NONE ],
	validOperators: [
		OPERATOR_IS,
		OPERATOR_IS_NOT,
		OPERATOR_IS_ANY,
		OPERATOR_IS_NONE,
	],
	getFormat: () => ( {} ),
} satisfies FieldType< any >;
