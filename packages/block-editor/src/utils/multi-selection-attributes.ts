import { isPlainObject } from './object';

type AttributeObject = Record< string, unknown >;

/**
 * Recursive function that computes the changes between two sets of values,
 * returning only those that differ. Performs a deep check.
 *
 * A key is absent when its value did not change, and present with an
 * `undefined` value when it was removed. Nested objects are walked key by key,
 * so a change to a single property means only that property is returned.
 *
 * @param previousValues Values before the change.
 * @param nextValues     Values after the change.
 *
 * @return The changed values, or `undefined` when none of them changed.
 */
function diffValues(
	previousValues: AttributeObject,
	nextValues: AttributeObject
): AttributeObject | undefined {
	const changes: AttributeObject = {};

	const keys = new Set( [
		...Object.keys( previousValues ),
		...Object.keys( nextValues ),
	] );

	for ( const key of keys ) {
		const previousValue = previousValues[ key ];
		const nextValue = nextValues[ key ];

		if ( previousValue === nextValue ) {
			continue;
		}

		if ( isPlainObject( nextValue ) ) {
			// Compare the values key by key, so that a change to one of them
			// does not affect the others. For a previous value that is not
			// an object an empty one is used in its place, ensuring every
			// value being added is recorded.
			const nestedChanges = diffValues(
				isPlainObject( previousValue ) ? previousValue : {},
				nextValue
			);

			if ( nestedChanges ) {
				changes[ key ] = nestedChanges;
			}
		} else if (
			nextValue === undefined &&
			isPlainObject( previousValue )
		) {
			// An object was removed. This is recorded as each of the properties
			// that were present being set to `undefined`. When the changes are
			// applied to another block's attributes, the result can be that all
			// properties are undefined, and the empty object will be cleaned up.
			//
			// Alternatively, applying the change to another block might still
			// leave some defined properties behind. For example, the first block
			// has border.top, and it becomes unset. When applied to another block
			// that only has border.left set to a value, the border.left will be
			// retained. It's ambiguous whether the intention was to unset all
			// border values or only border.top. The least destructive option is
			// picked.
			changes[ key ] = diffValues( previousValue, {} );
		} else {
			// Every scalar value is recorded verbatim, including one that
			// replaces an object with a shorthand, such as per-side borders
			// collapsing to `border: '5px'`.
			changes[ key ] = nextValue;
		}
	}

	return Object.keys( changes ).length > 0 ? changes : undefined;
}

/**
 * Returns the changes an attribute update makes to a block's attributes.
 *
 * `setAttributes` only performs a shallow update, so an update to an object
 * attribute contains the whole attribute data. For example, changing a single
 * style value means passing the block's entire `style` object. This function
 * computes and returns only the values that actually changed.
 *
 * @param attributes       The block's current attributes.
 * @param attributeUpdates The attribute update made to the block.
 *
 * @return The changed values, keyed by attribute name, or `undefined` when the
 *         update changes nothing.
 */
export function getAttributeChanges(
	attributes: AttributeObject,
	attributeUpdates: AttributeObject
): AttributeObject | undefined {
	// An update contains only modified attributes at the shallow level. Unmodified
	// attributes are left out of the comparison.
	//
	// Without this, ommitted properties in attributeUpdates would look like removals.
	const previousAttributes = Object.fromEntries(
		Object.keys( attributeUpdates ).map( ( key ) => [
			key,
			attributes[ key ],
		] )
	);

	return diffValues( previousAttributes, attributeUpdates );
}

/**
 * Recursive function that applies a change to a block's attribute value.
 *
 * A change that is not an object replaces the value outright. A change that is
 * an object is merged into the value key by key, so any existing deep attributes
 * on a block are not replaced.
 *
 * @param blockValue The block's current value.
 * @param change     The change to apply.
 *
 * @return The block's new value, or `undefined` when nothing is left of it.
 */
function applyValueChange( blockValue: unknown, change: unknown ): unknown {
	if ( ! isPlainObject( change ) ) {
		return change;
	}

	const newBlockValue = isPlainObject( blockValue ) ? { ...blockValue } : {};

	for ( const key of Object.keys( change ) ) {
		const newValue = applyValueChange(
			newBlockValue[ key ],
			change[ key ]
		);

		if ( newValue === undefined ) {
			delete newBlockValue[ key ];
		} else {
			newBlockValue[ key ] = newValue;
		}
	}

	// Blocks do not keep empty branches such as `style.color: {}` around, so a
	// branch the change emptied out is dropped rather than left behind.
	return Object.keys( newBlockValue ).length > 0 ? newBlockValue : undefined;
}

/**
 * Applies attribute changes to a block's attributes.
 *
 * This differs from a regular `setAttributes` in that a deep merge is performed,
 * not a shallow merge. This function is intended to be used for multi-block
 * updates, where a shallow merge would unintentionally overwrite deeply nested
 * values on blocks in the range.
 *
 * See https://github.com/WordPress/gutenberg/issues/51609 for the relevant bug report.
 *
 * @param attributes The block's current attributes.
 * @param changes    Changes from `getAttributeChanges`.
 *
 * @return The attributes to update on the block, ready for
 *         `updateBlockAttributes`.
 */
export function applyAttributeChanges(
	attributes: AttributeObject,
	changes: AttributeObject
): AttributeObject {
	const attributeUpdates: AttributeObject = {};

	for ( const key of Object.keys( changes ) ) {
		attributeUpdates[ key ] = applyValueChange(
			attributes[ key ],
			changes[ key ]
		);
	}

	return attributeUpdates;
}
