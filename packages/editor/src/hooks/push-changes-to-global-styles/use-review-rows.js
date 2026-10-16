import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	getStyle,
	getValueFromVariable,
} from '@wordpress/global-styles-engine';
import { getStyleLabel } from './style-labels';
import { getSiblingCurrentValue } from './sibling-styles';
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

/**
 * The sibling equivalent of `useReviewRows`.
 *
 * The "Current" column means something different here: rather than the block
 * type's Global Styles value, it's the value the siblings already share, or
 * `Varies` when they disagree. A sibling that sets nothing of its own falls
 * back to the block type's Global Styles value, which is what it renders with
 * and what Apply replaces.
 *
 * @param {Array}  rows     Grouped rows from `useChangesToPush`.
 * @param {Array}  siblings Siblings as `{ clientId, attributes }`.
 * @param {Object} merged   Merged Global Styles config, used to resolve presets.
 * @param {string} name     Block name.
 *
 * @return {Array} Rows with `label`, `currentValue`, `formattedCurrentValue`
 *                 and `formattedNewValue` added.
 */
export function useSiblingReviewRows( rows, siblings, merged, name ) {
	return useMemo( () => {
		const resolve = ( value ) =>
			getValueFromVariable( merged, name, value );

		// Keep preset values encoded so they compare against the siblings'
		// own preset values, which are read in the same form.
		const getInheritedValue = ( path ) =>
			getStyle( merged, path.join( '.' ), name, false );

		return rows.map( ( row ) => {
			const { value, varies } = getSiblingCurrentValue(
				row,
				siblings,
				getInheritedValue
			);

			return {
				...row,
				label: getStyleLabel( row.primaryPath ),
				currentValue: value,
				formattedCurrentValue: varies
					? // Shown when the siblings don't share one value.
						__( 'Varies' )
					: formatReviewValue( row.format, value, resolve ),
				formattedNewValue: formatReviewValue(
					row.format,
					row.newValue,
					resolve
				),
			};
		} );
	}, [ rows, siblings, merged, name ] );
}
