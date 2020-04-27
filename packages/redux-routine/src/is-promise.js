/**
 * Returns true if the given object is Promise.
 *
 * @param {*} obj Object to test
 *
 * @return {boolean}  Whether object is Promise.
 */
export function isPromise( obj ) {
	return (
		!! obj &&
		( typeof obj === 'object' || typeof obj === 'function' ) &&
		typeof obj.then === 'function'
	);
}
