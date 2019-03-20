/**
 * External dependencies
 */

import { omit } from 'lodash';

/**
 * WordPress dependencies
 */

import { createElement, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */

import { toTree } from './to-tree';

/**
 * Creates a path as an array of indices from the given root node to the given
 * node.
 *
 * @param {Node}        node     Node to find the path of.
 * @param {HTMLElement} rootNode Root node to find the path from.
 * @param {Array}       path     Initial path to build on.
 *
 * @return {Array} The path from the root node to the node.
 */
function createPathToNode( node, rootNode, path ) {
	const parent = node.parent;

	path = [ parent.children.indexOf( node ), ...path ];

	if ( parent !== rootNode ) {
		path = createPathToNode( parent, rootNode, path );
	}

	return path;
}

function prepareFormats( prepareEditableTree = [], value ) {
	return prepareEditableTree.reduce( ( accumlator, fn ) => {
		return fn( accumlator, value.text );
	}, value.formats );
}

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
	multilineWrapperTags,
	prepareEditableTree,
} ) {
	let startPath = [];
	let endPath = [];

	const tree = toTree( {
		value: {
			...value,
			formats: prepareFormats( prepareEditableTree, value ),
		},
		multilineTag,
		multilineWrapperTags,
		createEmpty,
		append,
		getLastChild,
		getParent,
		isText,
		getText,
		remove,
		appendText,
		onStartIndex( body, pointer ) {
			startPath = createPathToNode( pointer, body, [ pointer.text.length ] );
		},
		onEndIndex( body, pointer ) {
			endPath = createPathToNode( pointer, body, [ pointer.text.length ] );
		},
		isEditableTree: true,
	} );

	return {
		element: (
			<Fragment>
				{ createChildrenHTML( tree.children ) }
			</Fragment>
		),
		selection: { startPath, endPath },
	};
}

function createEmpty() {
	return {};
}

function getLastChild( { children } ) {
	return children && children[ children.length - 1 ];
}

function append( parent, object ) {
	if ( typeof object === 'string' ) {
		object = { text: object };
	}

	object.parent = parent;
	parent.children = parent.children || [];
	parent.children.push( object );
	return object;
}

function appendText( object, text ) {
	object.text += text;
}

function getParent( { parent } ) {
	return parent;
}

function isText( { text } ) {
	return typeof text === 'string';
}

function getText( { text } ) {
	return text;
}

function remove( object ) {
	const index = object.parent.children.indexOf( object );

	if ( index !== -1 ) {
		object.parent.children.splice( index, 1 );
	}

	return object;
}

function createElementHTML( { type, attributes = {}, object, children }, index ) {
	const props = {
		key: index,
		className: attributes.class,
		...omit( attributes, 'class' ),
	};

	if ( object ) {
		return createElement( type, props );
	}

	return createElement( type, props, createChildrenHTML( children ) );
}

function createChildrenHTML( children = [] ) {
	return children.map( ( child, index ) => {
		return child.text === undefined ? createElementHTML( child, index ) : child.text;
	} );
}
