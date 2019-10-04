/**
 * WordPress dependencies
 */
import { createElement, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { toObjectTree } from './to-object-tree';

/**
 * Create an HTML string from a Rich Text value. If a `multilineTag` is
 * provided, text separated by a line separator will be wrapped in it.
 *
 * @param {Object} $1                      Named argements.
 * @param {Object} $1.value                Rich text value.
 * @param {string} $1.multilineTag         Multiline tag.
 * @param {Array}  $1.multilineWrapperTags Tags where lines can be found if
 *                                         nesting is possible.
 *
 * @return {string} HTML string.
 */
export function toElement( {
	value,
	multilineTag,
	prepareEditableTree,
	placeholder,
} ) {
	if ( prepareEditableTree ) {
		value = {
			...value,
			formats: prepareEditableTree( value ),
		};
	}

	const tree = toObjectTree( {
		value,
		multilineTag,
		isEditableTree: true,
		placeholder,
	} );
	const elementTree = createElementTree( tree.children );

	return createElement( Fragment, null, ...elementTree );
}

function createElementTree( objects = [] ) {
	return objects.map( ( { type, attributes, object, children, text } ) => {
		if ( text !== undefined ) {
			return text;
		}

		if ( attributes && 'contentEditable' in attributes ) {
			attributes.suppressContentEditableWarning = true;
		}

		if ( object ) {
			return createElement( type, attributes );
		}

		return createElement( type, attributes, ...createElementTree( children ) );
	} );
}
