type AttributeObject = Record< string, unknown >;

/**
 * Whether an attribute is an object, such as `style`.
 *
 * @param attribute Attribute to test.
 *
 * @return Whether the attribute is an object.
 */
function isObjectAttribute( attribute: unknown ): attribute is AttributeObject {
	return (
		typeof attribute === 'object' &&
		attribute !== null &&
		! Array.isArray( attribute )
	);
}

/**
 * Recursive function that computes the changes between two sets of values,
 * holding only those that differ. Performs a deep check.
 *
 * A key is absent when its value did not change, and present with an
 * `undefined` value when it was removed. Nested objects are walked key by key,
 * so a change to a single style produces changes holding that style alone.
 *
 * @param previousValues Values before the change.
 * @param nextValues     Values after the change.
 *
 * @return The changed values, or `undefined` when none of them changed.
 */
function getValueChanges(
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

		// A value that is or becomes an object is compared key by key. The
		// side that is not an object stands in as an empty one, so adding an
		// object records every value in it, and removing one records the
		// removal of each value it held.
		if (
			isObjectAttribute( previousValue ) ||
			isObjectAttribute( nextValue )
		) {
			const nestedChanges = getValueChanges(
				isObjectAttribute( previousValue ) ? previousValue : {},
				isObjectAttribute( nextValue ) ? nextValue : {}
			);

			if ( nestedChanges ) {
				changes[ key ] = nestedChanges;
			}
		} else {
			changes[ key ] = nextValue;
		}
	}

	return Object.keys( changes ).length > 0 ? changes : undefined;
}

/**
 * Returns the changes an attribute update makes to a block's attributes.
 *
 * `setAttributes` only performs a shallow update, so an update to an object
 * attribute carries that attribute whole: changing a single style means passing
 * the block's entire `style` object. Comparing the two tells apart the values
 * the update changes from the values it merely carries along, which is what
 * lets the same edit be applied to a block holding different values.
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
	// An update only mentions the attributes it means to change, so the rest of
	// the block's attributes are left out of the comparison. Without this they
	// would look like removals.
	const previousAttributes = Object.fromEntries(
		Object.keys( attributeUpdates ).map( ( key ) => [
			key,
			attributes[ key ],
		] )
	);

	return getValueChanges( previousAttributes, attributeUpdates );
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
	if ( ! isObjectAttribute( change ) ) {
		return change;
	}

	const newBlockValue = isObjectAttribute( blockValue )
		? { ...blockValue }
		: {};

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
 * Applies changes made to one block's attributes to another block's attributes.
 *
 * Only the values the changes hold are applied, so the block keeps the values
 * they do not mention. A block with its own background color keeps it when a
 * text color is applied across a selection.
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
