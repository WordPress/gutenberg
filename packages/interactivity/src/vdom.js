/**
 * External dependencies
 */
import { h } from 'preact';
/**
 * Internal dependencies
 */
import { directivePrefix as p } from './constants';
import { warn } from './utils/warn';
import { isReservedKey, jsonReviver } from './utils/prototype-chain';

const ignoreAttr = `data-${ p }-ignore`;
const islandAttr = `data-${ p }-interactive`;
const fullPrefix = `data-${ p }-`;

// Regular expression for directive parsing.
const directiveParser = new RegExp(
	`^data-${ p }-` + // ${p} must be a prefix string, like 'wp'.
		// Match alphanumeric characters including hyphen-separated
		// segments. It excludes underscore intentionally to prevent confusion.
		// E.g., "custom-directive".
		'([a-z0-9]+(?:-[a-z0-9]+)*)' +
		// (Optional) Match '--' followed by any alphanumeric charachters. It
		// excludes underscore intentionally to prevent confusion, but it can
		// contain multiple hyphens. E.g., "--custom-prefix--with-more-info".
		'(?:--([a-z0-9_-]+))?$',
	'i' // Case insensitive.
);

/**
 * Checks whether a directive name part is reserved after trimming hyphens and
 * lowercasing it, as `kebabToCamelCase()` does on newer branches, where
 * `data-wp-each--constructor-` names the item `constructor`.
 *
 * Directive names and suffixes become property keys: `data-wp-bind--[attribute]`,
 * for example, assigns to the element's props.
 *
 * @param {string} part Part of a directive name.
 * @return {boolean} Whether the part is reserved.
 */
const isReservedNamePart = ( part ) =>
	isReservedKey( part.replace( /^-+|-+$/g, '' ).toLowerCase() );

export const hydratedIslands = new WeakSet();

const directiveMaps = new WeakSet();

/**
 * Checks whether the passed value is a directive map created by `toVdom()`.
 *
 * @param {unknown} value The value to check.
 * @return {boolean} Whether the value is a directive map created by `toVdom()`.
 */
export const isDirectiveMap = ( value ) =>
	typeof value === 'object' && value !== null && directiveMaps.has( value );

// Recursive function that transforms a DOM tree into vDOM.
export function toVdom( root ) {
	const treeWalker = document.createTreeWalker(
		root,
		205 // ELEMENT + TEXT + COMMENT + CDATA_SECTION + PROCESSING_INSTRUCTION
	);

	function walk( node ) {
		const { attributes, nodeType } = node;

		if ( nodeType === 3 ) return [ node.data ];
		if ( nodeType === 4 ) {
			const next = treeWalker.nextSibling();
			node.replaceWith( new window.Text( node.nodeValue ) );
			return [ node.nodeValue, next ];
		}
		if ( nodeType === 8 || nodeType === 7 ) {
			const next = treeWalker.nextSibling();
			node.remove();
			return [ null, next ];
		}

		const props = {};
		const children = [];
		// Keyed by directive names from the markup, so it has no prototype.
		const directives = Object.create( null );
		let hasDirectives = false;
		let ignore = false;
		let island = false;

		for ( let i = 0; i < attributes.length; i++ ) {
			const n = attributes[ i ].name;
			if (
				n[ fullPrefix.length ] &&
				n.slice( 0, fullPrefix.length ) === fullPrefix
			) {
				if ( n === ignoreAttr ) {
					ignore = true;
				} else if ( n === islandAttr ) {
					island = true;
				} else {
					hasDirectives = true;
					let val = attributes[ i ].value;
					try {
						val = JSON.parse( val, jsonReviver );
					} catch ( e ) {}
					const [ , prefix, suffix = 'default' ] =
						directiveParser.exec( n );
					if (
						isReservedNamePart( prefix ) ||
						suffix.split( '--' ).some( isReservedNamePart )
					) {
						warn( `Found malformed directive name: ${ n }.` );
					} else {
						directives[ prefix ] = directives[ prefix ] || {};
						directives[ prefix ][ suffix ] = val;
					}
				}
			} else if ( n === 'ref' ) {
				continue;
			}
			props[ n ] = attributes[ i ].value;
		}

		if ( ignore && ! island ) {
			// Keyed by directive names, so it has no prototype.
			const ignoreDirectives = Object.assign( Object.create( null ), {
				ignore: true,
			} );
			directiveMaps.add( ignoreDirectives );
			return [
				h( node.localName, {
					...props,
					innerHTML: node.innerHTML,
					__directives: ignoreDirectives,
				} ),
			];
		}
		if ( island ) hydratedIslands.add( node );

		if ( hasDirectives ) {
			props.__directives = directives;
			directiveMaps.add( directives );
		}

		let child = treeWalker.firstChild();
		if ( child ) {
			while ( child ) {
				const [ vnode, nextChild ] = walk( child );
				if ( vnode ) children.push( vnode );
				child = nextChild || treeWalker.nextSibling();
			}
			treeWalker.parentNode();
		}

		return [ h( node.localName, props, children ) ];
	}

	return walk( treeWalker.currentNode );
}
