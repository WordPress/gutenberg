/**
 * External dependencies
 */
import { pickBy, isEqual, isObject, identity, mapValues } from 'lodash';

/**
 * Removed undefined values from nested object.
 *
 * @param {*} object
 * @return {*} Object cleaned from undefined values
 */
export const cleanEmptyObject = ( object ) => {
	if ( ! isObject( object ) ) {
		return object;
	}
	const cleanedNestedObjects = pickBy(
		mapValues( object, cleanEmptyObject ),
		identity
	);
	return isEqual( cleanedNestedObjects, {} )
		? undefined
		: cleanedNestedObjects;
};

export const STYLE_MAPPINGS = {
	lineHeight: [ 'typography', 'lineHeight' ],
	fontSize: [ 'typography', 'fontSize' ],
	background: [ 'color', 'gradient' ],
	backgroundColor: [ 'color', 'background' ],
	color: [ 'color', 'text' ],
	'--wp--style--color--link': [ 'color', 'link' ],
	paddingTop: [ 'spacing', 'padding', 'top' ],
	paddingRight: [ 'spacing', 'padding', 'right' ],
	paddingBottom: [ 'spacing', 'padding', 'bottom' ],
	paddingLeft: [ 'spacing', 'padding', 'left' ],
};
