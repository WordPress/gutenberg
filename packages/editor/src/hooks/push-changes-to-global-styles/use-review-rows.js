/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import {
	getStyle,
	getValueFromVariable,
} from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { getStyleLabel } from './style-labels';
import {
	formatStyleValue,
	formatBorderShorthand,
	formatBorderRadius,
	formatSpacingShorthand,
	formatBlockGap,
} from './format-style-value';

/**
 * Turns a raw style value into readable text, using the row's `format` hint so
 * borders and spacing show as a single CSS value instead of a raw object.
 *
 * @param {string}   format  Optional format hint (`border`, `borderRadius`,
 *                           `spacing`, `blockGap`).
 * @param {*}        value   The raw style value.
 * @param {Function} resolve Callback to resolve preset values (used for spacing).
 *
 * @return {string} Readable text for the value.
 */
function formatReviewValue( format, value, resolve ) {
	if ( format === 'border' ) {
		return formatBorderShorthand( value );
	}
	if ( format === 'borderRadius' ) {
		return formatBorderRadius( value );
	}
	if ( format === 'spacing' ) {
		return formatSpacingShorthand( value, resolve );
	}
	if ( format === 'blockGap' ) {
		return formatBlockGap( value, resolve );
	}
	return formatStyleValue( value );
}

/**
 * Adds display details to each change row: a readable label, the block type's
 * current Global Styles value, and readable versions of the current and new
 * values.
 *
 * @param {Array}  rows   Grouped rows from `useChangesToPush`.
 * @param {Object} merged Merged Global Styles config.
 * @param {string} name   Block name.
 *
 * @return {Array} Rows with `label`, `currentValue`, `formattedCurrentValue`
 *                 and `formattedNewValue` added.
 */
export function useReviewRows( rows, merged, name ) {
	return useMemo( () => {
		// Swaps preset values (e.g. `var:preset|spacing|40`) for their real
		// size so spacing reads as a size rather than a preset name.
		const resolve = ( value ) =>
			getValueFromVariable( merged, name, value );

		return rows.map( ( row ) => {
			const currentValue = getStyle(
				merged,
				row.primaryPath.join( '.' ),
				name,
				// Keep preset values encoded (e.g. `var:preset|color|vivid-red`)
				// so they show by name, matching the new value.
				false
			);
			return {
				...row,
				label: getStyleLabel( row.primaryPath ),
				currentValue,
				formattedCurrentValue: formatReviewValue(
					row.format,
					currentValue,
					resolve
				),
				formattedNewValue: formatReviewValue(
					row.format,
					row.newValue,
					resolve
				),
			};
		} );
	}, [ rows, merged, name ] );
}
