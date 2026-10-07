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
 * Style values are plain JSON: a string, a number, or an object or array of
 * them (a border, a per-side spacing object, or the list of values a grouped
 * row covers). That's narrow enough not to warrant a dependency, and
 * `@wordpress/editor` doesn't declare one.
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

// The parts a `border` row is about, in the order CSS writes them. The flat
// `style.border` object also carries `radius` and a sub-object per side, both
// of which have rows of their own, so reading `border` in one go would take in
// more than the row covers.
const BORDER_SHORTHAND_KEYS = [ 'width', 'style', 'color' ];

const BORDER_SIDES = [ 'top', 'right', 'bottom', 'left' ];

/**
 * One property of a border row as the block currently has it.
 *
 * The all-sides row writes each side as well as the shorthand, so a block that
 * only holds per-side values still has a border the row overwrites. Those are
 * collapsed the way the modal displays a per-side border: a value is kept only
 * when every side that sets one agrees.
 *
 * @param {Function} read        Reads a style path on a block, falling back to
 *                               the block type's Global Styles value.
 * @param {Object}   attributes  Block attributes.
 * @param {string[]} primaryPath The row's style path.
 * @param {string}   key         A border property (`width`, `style`, `color`).
 *
 * @return {*} The value, or `undefined` when the block has none.
 */
function getBorderPropertyValue( read, attributes, primaryPath, key ) {
	const flatValue = read( attributes, [ ...primaryPath, key ] );

	// A side row (`border.top`) has no sides of its own to collapse.
	if ( flatValue !== undefined || primaryPath.length > 1 ) {
		return flatValue;
	}

	const setSides = BORDER_SIDES.filter( ( side ) =>
		read( attributes, [ ...primaryPath, side ] )
	);
	const sideValues = setSides.map( ( side ) =>
		read( attributes, [ ...primaryPath, side, key ] )
	);

	return sideValues.length &&
		sideValues.every( ( value ) => value === sideValues[ 0 ] )
		? sideValues[ 0 ]
		: undefined;
}

/**
 * A block's current value for a change row, shaped like the row's `newValue` so
 * the "Current" and "New" columns read the same way.
 *
 * A border row is assembled from the properties it actually writes rather than
 * read off `style.border` wholesale, which keeps a radius or a width the row
 * leaves alone out of the comparison.
 *
 * @param {Function} read       Reads a style path on a block, falling back to
 *                              the block type's Global Styles value.
 * @param {Object}   row        The change row.
 * @param {Object}   attributes Block attributes.
 *
 * @return {*} The value, or `undefined` when the block has none of the row's
 *   properties.
 */
function getRowCurrentValue( read, row, attributes ) {
	if ( row.format !== 'border' ) {
		return read( attributes, row.primaryPath );
	}

	const writtenProperties = new Set(
		row.paths.map( ( { path } ) => path[ path.length - 1 ] )
	);

	const border = {};
	let hasValue = false;

	for ( const key of BORDER_SHORTHAND_KEYS ) {
		if ( ! writtenProperties.has( key ) ) {
			continue;
		}
		const value = getBorderPropertyValue(
			read,
			attributes,
			row.primaryPath,
			key
		);
		if ( value !== undefined ) {
			border[ key ] = value;
			hasValue = true;
		}
	}

	return hasValue ? border : undefined;
}

/**
 * The value the siblings currently share for a change row.
 *
 * With more than one sibling there's no single "current" value to show, so the
 * shared value is only meaningful when they all agree. When they don't, the
 * caller shows that the value varies rather than picking one arbitrarily.
 *
 * A row can cover more than one style path — a link color row also writes the
 * hover color, a border row writes each side — so the siblings are compared
 * across every path the row writes as well as the value on show. Anything the
 * row leaves alone, such as a border radius, isn't a difference for this row.
 *
 * A sibling that sets nothing of its own still renders with whatever Global
 * Styles gives the block type, and Apply replaces that, so `getInheritedValue`
 * stands in where the sibling has no value. Without it a sibling inheriting a
 * color shows an em dash, and reads as varying from a sibling that sets the
 * same color itself. Every sibling is the same block type as the block being
 * applied from, so they all inherit the same values.
 *
 * @param {Object}    row               The change row.
 * @param {Array}     siblings          Siblings as `{ clientId, attributes }`.
 * @param {?Function} getInheritedValue Returns the block type's Global Styles
 *                                      value for a style path.
 *
 * @return {{value: *, varies: boolean}} The shared value, and whether the
 *   siblings disagree.
 */
export function getSiblingCurrentValue( row, siblings, getInheritedValue ) {
	if ( ! siblings?.length ) {
		return { value: undefined, varies: false };
	}

	const read = ( attributes, path ) => {
		// A preset attribute (e.g. `textColor`) counts as the block's own
		// value, so read through `getBlockStyleValue` rather than `style`.
		const value = getBlockStyleValue( attributes, path );
		return value !== undefined ? value : getInheritedValue?.( path );
	};

	const entries = siblings.map( ( { attributes } ) => ( {
		value: getRowCurrentValue( read, row, attributes ),
		// Every path the row writes, so a difference it would overwrite counts
		// even when the displayed value doesn't cover it.
		written: row.paths.map( ( { path } ) => read( attributes, path ) ),
	} ) );

	const [ first ] = entries;
	const varies = ! entries.every(
		( entry ) =>
			isEqualStyleValue( entry.value, first.value ) &&
			isEqualStyleValue( entry.written, first.written )
	);

	return { value: varies ? undefined : first.value, varies };
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
