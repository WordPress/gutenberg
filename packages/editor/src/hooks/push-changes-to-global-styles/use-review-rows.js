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
} from './format-style-value';

/**
 * Formats a raw style value for display, using the row's `format` hint so
 * border scopes render as CSS shorthands rather than raw objects.
 *
 * @param {string}   format  Optional format hint (`border`, `borderRadius`,
 *                           `spacing`).
 * @param {*}        value   The raw style value.
 * @param {Function} resolve Resolver for preset tokens (used for spacing).
 *
 * @return {string} A human-friendly representation of the value.
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
	return formatStyleValue( value );
}

/**
 * Enriches grouped change rows with a human-readable label and the current
 * effective Global Styles value for the block type, plus display-formatted
 * versions of the current and new values.
 *
 * @param {Array}  rows   Grouped rows from `useChangesToPush`.
 * @param {Object} merged Merged Global Styles config.
 * @param {string} name   Block name.
 *
 * @return {Array} Rows extended with `label`, `currentValue`,
 *                 `formattedCurrentValue`, and `formattedNewValue`.
 */
export function useReviewRows( rows, merged, name ) {
	return useMemo( () => {
		// Resolves preset tokens (e.g. `var:preset|spacing|40`) to their actual
		// values so spacing reads as a real size rather than a preset slug.
		const resolve = ( value ) =>
			getValueFromVariable( merged, name, value );

		return rows.map( ( row ) => {
			const currentValue = getStyle(
				merged,
				row.primaryPath.join( '.' ),
				name
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
