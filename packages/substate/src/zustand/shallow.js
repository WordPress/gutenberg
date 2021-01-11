/**
 * @typedef {Record<string | number | symbol, unknown>} Obj
 */

/**
 * @template {any}T
 * @template {any}U
 *
 * @param {T} objA
 * @param {U} objB
 */
export default function shallow( objA, objB ) {
	if ( Object.is( objA, objB ) ) {
		return true;
	}
	if (
		typeof objA !== 'object' ||
		objA === null ||
		typeof objB !== 'object' ||
		objB === null
	) {
		return false;
	}

	const keysA = Object.keys( /** @type {Object} */ ( objA ) );
	if (
		keysA.length !== Object.keys( /** @type {Object} */ ( objB ) ).length
	) {
		return false;
	}
	for ( let i = 0; i < keysA.length; i++ ) {
		if (
			! Object.prototype.hasOwnProperty.call( objB, keysA[ i ] ) ||
			! Object.is(
				/** @type {Obj} */ ( objA )[ keysA[ i ] ],
				/** @type {Obj} */ ( objB )[ keysA[ i ] ]
			)
		) {
			return false;
		}
	}
	return true;
}
