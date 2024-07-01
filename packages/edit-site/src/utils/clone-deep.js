/**
 * Makes a copy of an object without storing any references to the original object.
 * @param {Object} object
 * @return {Object} The cloned object.
 */
export default function cloneDeep( object ) {
	return ! object ? {} : JSON.parse( JSON.stringify( object ) );
}
