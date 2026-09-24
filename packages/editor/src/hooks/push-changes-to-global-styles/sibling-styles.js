import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';
import setNestedValue from '../../utils/set-nested-value';
import {
	STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE,
	getBlockStyleValue,
} from './style-paths';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

const PRESET_USER_PREFIX = 'var:preset|';

// True for a preset in its user form, e.g. `var:preset|color|vivid-red`. Some
// of those are carried by a block attribute (`textColor`) and some live in
// `style` (a spacing size, a link color, a per-side border color).
const isPresetValue = ( value ) =>
	typeof value === 'string' && value.startsWith( PRESET_USER_PREFIX );

/**
 * Deep equality for style values.
 *
 * Style values are plain JSON: a string, a number, or an object of them (a
 * border or a per-side spacing object). That's narrow enough not to warrant a
 * dependency, and `@wordpress/editor` doesn't declare one.
 *
 * @param {*} a First value.
 * @param {*} b Second value.
 *
 * @return {boolean} Whether the two values are equal.
 */
export function isEqualStyleValue( a, b ) {
	if ( a === b ) {
		return true;
	}

	if (
		typeof a !== 'object' ||
		typeof b !== 'object' ||
		a === null ||
		b === null
	) {
		return false;
	}

	const aKeys = Object.keys( a );
	const bKeys = Object.keys( b );

	if ( aKeys.length !== bKeys.length ) {
		return false;
	}

	return aKeys.every(
		( key ) =>
			Object.prototype.hasOwnProperty.call( b, key ) &&
			isEqualStyleValue( a[ key ], b[ key ] )
	);
}

/**
 * The value the siblings currently share for a change row.
 *
 * With more than one sibling there's no single "current" value to show, so the
 * shared value is only meaningful when they all agree. When they don't, the
 * caller shows that the value varies rather than picking one arbitrarily.
 *
 * @param {Object} row      The change row.
 * @param {Array}  siblings Siblings as `{ clientId, attributes }`.
 *
 * @return {{value: *, varies: boolean}} The shared value, and whether the
 *   siblings disagree.
 */
export function getSiblingCurrentValue( row, siblings ) {
	if ( ! siblings?.length ) {
		return { value: undefined, varies: false };
	}

	const values = siblings.map( ( { attributes } ) =>
		getBlockStyleValue( attributes, row.primaryPath )
	);
	const [ first ] = values;
	const varies = ! values.every( ( value ) =>
		isEqualStyleValue( value, first )
	);

	return { value: varies ? undefined : first, varies };
}

/**
 * Works out the attribute updates that copy the chosen rows onto each sibling,
 * without applying them.
 *
 * Only the chosen rows are written. A sibling's other styles are left alone,
 * which differs from a wholesale copy: unchecking a row means "leave this one
 * as it is", not "reset it".
 *
 * The result is keyed by clientId, ready for `updateBlockAttributes` with
 * `uniqueByBlock`, because each sibling merges the new styles into its own
 * `style` object.
 *
 * @param {Object} options             Options.
 * @param {Array}  options.rowsToApply The rows to copy.
 * @param {Object} options.attributes  The source block's attributes.
 * @param {Array}  options.siblings    Siblings as `{ clientId, attributes }`.
 *
 * @return {?Object} Attribute updates keyed by clientId, or `null` when
 *   there's nothing to apply.
 */
export function getSiblingStylesUpdate( {
	rowsToApply,
	attributes,
	siblings,
} ) {
	if ( ! rowsToApply?.length || ! siblings?.length ) {
		return null;
	}

	const updates = {};

	for ( const sibling of siblings ) {
		const newStyles = structuredClone( sibling.attributes?.style ?? {} );
		const update = {};
		let hasChange = false;

		for ( const row of rowsToApply ) {
			// A preset lives in its own block attribute (e.g. `textColor`), so
			// copy that across instead of writing the `var:preset|…` form into
			// `style`.
			for ( const presetAttribute of row.presetAttributes ) {
				update[ presetAttribute ] = attributes[ presetAttribute ];
				hasChange = true;
			}

			for ( const { path, value } of row.paths ) {
				// This row's preset travels as a block attribute, copied above,
				// so clear any custom value the sibling had at this path rather
				// than writing the `var:preset|…` form into `style`, where it
				// would compete with the attribute.
				if ( isPresetValue( value ) && row.presetAttributes.length ) {
					setNestedValue( newStyles, path, undefined );
					continue;
				}

				// Everything else is copied as-is, including a preset with no
				// attribute behind it: a spacing size, a link color and a
				// per-side border color all live in `style` on the source
				// block, so they belong in `style` on the siblings too.
				setNestedValue( newStyles, path, value );
				hasChange = true;

				// A preset attribute the sibling already has would survive the
				// copy and keep winning over the value just written, so clear
				// it.
				const competingAttribute =
					STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE[ path.join( '.' ) ];
				if (
					competingAttribute &&
					sibling.attributes?.[ competingAttribute ] !== undefined
				) {
					update[ competingAttribute ] = undefined;
				}
			}
		}

		if ( ! hasChange ) {
			continue;
		}

		update.style = cleanEmptyObject( newStyles );
		updates[ sibling.clientId ] = update;
	}

	return Object.keys( updates ).length > 0 ? updates : null;
}

// The two scopes the Styles control can apply to.
export const SCOPE_GLOBAL = 'global';
export const SCOPE_SIBLINGS = 'siblings';
