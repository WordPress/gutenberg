import fastDeepEqual from 'fast-deep-equal/es6/index.js';

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
 * Applies the change made to one block's attribute onto another block's value
 * for the same attribute.
 *
 * Object attributes such as `style` are walked key by key, so each block keeps
 * the values the change did not touch: setting a text color leaves every
 * block's own background alone, while a value the change removed is removed
 * everywhere. Every other attribute — a string, a number, an array, or
 * `undefined` — replaces the other block's attribute outright, so clearing an
 * attribute clears it across the whole selection.
 *
 * @param previousAttribute The first block's attribute before the change.
 * @param nextAttribute     The first block's attribute after the change.
 * @param blockAttribute    The attribute belonging to the block being updated.
 *
 * @return The block's new attribute, or `undefined` when nothing is left of it.
 */
function applyAttributeChange(
	previousAttribute: unknown,
	nextAttribute: unknown,
	blockAttribute: unknown
): unknown {
	if (
		! isObjectAttribute( previousAttribute ) &&
		! isObjectAttribute( nextAttribute )
	) {
		return nextAttribute;
	}

	// Either side may be absent, because a control can add an attribute that
	// was not set before, or remove one entirely. The missing side stands in as
	// an empty object so the keys of the other side are still visited.
	const previousObject = isObjectAttribute( previousAttribute )
		? previousAttribute
		: {};
	const nextObject = isObjectAttribute( nextAttribute ) ? nextAttribute : {};
	const updatedAttribute = isObjectAttribute( blockAttribute )
		? { ...blockAttribute }
		: {};

	const keys = new Set( [
		...Object.keys( previousObject ),
		...Object.keys( nextObject ),
	] );

	for ( const key of keys ) {
		// This attribute did not change, so keep the block's own value for it.
		if ( previousObject[ key ] === nextObject[ key ] ) {
			continue;
		}

		const newValue = applyAttributeChange(
			previousObject[ key ],
			nextObject[ key ],
			updatedAttribute[ key ]
		);

		if ( newValue === undefined ) {
			delete updatedAttribute[ key ];
		} else {
			updatedAttribute[ key ] = newValue;
		}
	}

	// Blocks do not keep empty branches such as `style.color: {}` around, so a
	// branch the change emptied out is dropped rather than left behind.
	return Object.keys( updatedAttribute ).length > 0
		? updatedAttribute
		: undefined;
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
	// Calculate the attribute keys that actually contain updates
	// for the first block in the selection.
	const changedKeys = Object.keys( attributeUpdates ).filter(
		( key ) =>
			! fastDeepEqual(
				firstBlockAttributes[ key ],
				attributeUpdates[ key ]
			)
	);

	if ( changedKeys.length === 0 ) {
		return undefined;
	}

	// For each block, calculate the attributes updates.
	const updatesByClientId: Record< string, AttributeObject > = {};
	for ( const [ clientId, blockAttributes ] of Object.entries(
		attributesByClientId
	) ) {
		const blockUpdates: AttributeObject = {};

		for ( const key of changedKeys ) {
			blockUpdates[ key ] = applyAttributeChange(
				firstBlockAttributes[ key ],
				attributeUpdates[ key ],
				blockAttributes[ key ]
			);
		}

		updatesByClientId[ clientId ] = blockUpdates;
	}

	return updatesByClientId;
}
