// Weakly referenced map allows unused ids to be garbage collected.
const weakMap = new WeakMap();

// Incrementing zero-based ID value.
let id = -1;

const prefix = 'link-control-instance';

function getKey( _id ) {
	return `${ prefix }-${ _id }`;
}

/**
 * Builds a unique link control key for the given object reference.
 *
 * @param {Object} instance an unique object reference specific to this link control instance.
 * @return {string} the unique key to use for this link control.
 */
function useLinkInstanceKey( instance ) {
	if ( ! instance ) {
		return;
	}
	if ( weakMap.has( instance ) ) {
		return getKey( weakMap.get( instance ) );
	}

	id += 1;

	weakMap.set( instance, id );

	return getKey( id );
}

export default useLinkInstanceKey;
