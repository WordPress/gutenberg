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
 * Returns the changes between two sets of attribute values, holding only the
 * values that differ.
 *
 * A key is absent when its value did not change, and present with an
 * `undefined` value when it was removed. Object attributes such as `style` are
 * walked key by key, so a change to a single style produces a change holding
 * that style alone.
 *
 * @param previousValues Values before the change.
 * @param nextValues     Values after the change.
 *
 * @return The changed values, or `undefined` when none of them changed.
 */
function getAttributeChanges(
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
			const nestedChanges = getAttributeChanges(
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
 * Applies a change to a block's value for the attribute it belongs to.
 *
 * A change that is not an object replaces the block's value, so a cleared
 * attribute is cleared on every block. A change that is an object is merged
 * into the block's own value key by key, so the block keeps the values the
 * change does not mention.
 *
 * @param change     The change to apply.
 * @param blockValue The block's current value.
 *
 * @return The block's new value, or `undefined` when nothing is left of it.
 */
function applyAttributeChange( change: unknown, blockValue: unknown ): unknown {
	if ( ! isObjectAttribute( change ) ) {
		return change;
	}

	const newBlockValue = isObjectAttribute( blockValue )
		? { ...blockValue }
		: {};

	for ( const key of Object.keys( change ) ) {
		const newValue = applyAttributeChange(
			change[ key ],
			newBlockValue[ key ]
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
 * Spreads an attribute update made to the first block of a multi-selection
 * across every block in that selection.
 *
 * `setAttributes` only performs a shallow update, which won't work for block
 * multi-selections, since the attribute object can contain data that can overwrite
 * existing values on other blocks in the selection.
 *
 * This function calculates a deep merge for each block in the selection to avoid
 * incorrect overwrites across the selection.
 *
 * @param firstBlockAttributes Attributes of the first block in the selection.
 * @param attributeUpdates     Attribute update made to the first block.
 * @param attributesByClientId Current attributes of each selected block.
 *
 * @return Attribute updates keyed by client ID, ready for
 *         `updateBlockAttributes` with the `uniqueByBlock` option, or
 *         `undefined` when nothing changed.
 */
export function getMultiSelectionAttributeUpdates(
	firstBlockAttributes: AttributeObject,
	attributeUpdates: AttributeObject,
	attributesByClientId: Record< string, AttributeObject >
): Record< string, AttributeObject > | undefined {
	// Only the attributes the update mentions are being changed, so the rest of
	// the first block's attributes are left out of the comparison.
	const previousAttributes = Object.fromEntries(
		Object.keys( attributeUpdates ).map( ( key ) => [
			key,
			firstBlockAttributes[ key ],
		] )
	);
	const changes = getAttributeChanges( previousAttributes, attributeUpdates );

	if ( ! changes ) {
		return undefined;
	}

	// For each block, calculate the attribute updates.
	const updatesByClientId: Record< string, AttributeObject > = {};

	for ( const [ clientId, blockAttributes ] of Object.entries(
		attributesByClientId
	) ) {
		const blockUpdates: AttributeObject = {};

		for ( const key of Object.keys( changes ) ) {
			blockUpdates[ key ] = applyAttributeChange(
				changes[ key ],
				blockAttributes[ key ]
			);
		}

		updatesByClientId[ clientId ] = blockUpdates;
	}

	return updatesByClientId;
}
