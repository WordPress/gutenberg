/**
 * External dependencies
 */
import {
	includes,
	filter,
	cloneDeep,
	get,
	set,
	forEach,
	partial,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, renderToString, RawHTML } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { deprecated } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { getBlockType } from '../api';

/**
 * Wrapper component for RawHTML, logging a warning about unsupported raw
 * markup return values from a block's `save` implementation.
 */
export class RawHTMLWithWarning extends Component {
	constructor() {
		super( ...arguments );

		deprecated( 'Returning raw HTML from block `save`', {
			version: '2.5',
			alternative: '`wp.element.RawHTML` component',
			plugin: 'Gutenberg',
			link: 'https://wordpress.org/gutenberg/handbook/block-api/block-edit-save/#save',
		} );
	}

	render() {
		const { children } = this.props;

		return <RawHTML>{ children }</RawHTML>;
	}
}

/**
 * Override save element for a block, providing support for deprecated HTML
 * return value, logging a warning advising the developer to use the preferred
 * RawHTML component instead.
 *
 * @param {WPElement} element Original block save return.
 *
 * @return {WPElement} Dangerously shimmed block save.
 */
export function shimRawHTML( element ) {
	// Still support string return from save, but in the same way any component
	// could render a string, it should be escaped. Therefore, only shim usage
	// which had included some HTML expected to be unescaped.
	if ( typeof element === 'string' && ( includes( element, '<' ) || /^\[.+\]$/.test( element ) ) ) {
		element = <RawHTMLWithWarning children={ element } />;
	}

	return element;
}

addFilter(
	'blocks.getSaveElement',
	'core/deprecated/shim-dangerous-html',
	shimRawHTML
);

/**
 * Replaces a React-sourced attribute schema, recursing into queried sources.
 * Returns true if a replacement has been made.
 *
 * @param {WPBlockType} schema Block type definition.
 *
 * @return {boolean} Whether a replacement has been made.
 */
function replaceReactSource( schema ) {
	const { source } = schema;

	// Recurse into query.
	if ( source === 'query' ) {
		// We could use `some`, but want to continue iterating over all entries
		// even after finding match.
		return !! filter( schema.query, replaceReactSource ).length;
	}

	if ( source !== 'children' && source !== 'node' ) {
		return false;
	}

	if ( source === 'children' ) {
		deprecated( 'Children attribute source', {
			version: '2.5',
			alternative: 'HTML attribute source as string type',
			plugin: 'Gutenberg',
			link: 'https://wordpress.org/gutenberg/handbook/block-api/attributes/#html',
		} );

		schema.source = 'html';
	} else if ( source === 'node' ) {
		deprecated( 'Node attribute source', {
			version: '2.5',
			alternative: 'outerHTML property attribute source as string type',
			plugin: 'Gutenberg',
		} );

		schema.source = 'property';
		schema.property = 'outerHTML';
	}

	// Type may not be specified if it's a nested query source.
	if ( schema.type ) {
		schema.type = 'string';
	}

	// If specified, default is an array of React element(s), so render
	// to equivalent HTML and replace.
	if ( schema.default ) {
		schema.default = renderToString( schema.default );
	}

	// Add compat flag, used in serialization step to shim raw HTML.
	schema._deprecated = source;

	return true;
}

/**
 * Upgrade deprecated `children` and `node` sources for registered block with
 * equivalent string-sourced configuration.
 *
 * @param {WPBlockType} settings Registered block type.
 *
 * @return {WPBlockType} Modified block type.
 */
export function shimReactSource( settings ) {
	// We could use `some`, but want to continue iterating over all entries
	// even after finding match.
	const hasReplacedSource = !! filter( settings.attributes, replaceReactSource ).length;

	if ( hasReplacedSource ) {
		settings._compatReactSource = true;
	}

	// Find and replace React sources within block deprecated definitions.
	forEach( settings.deprecated, shimReactSource );

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/deprecated/shim-react-source',
	shimReactSource
);

/**
 * Replaces attributes to or from a React equivalent value, recursing into
 * queried sources.
 *
 * @param {boolean} isToReact  Whether to transform string to React format,
 *                             otherwise from a React format to string.
 * @param {Object}  schema     Attribute schema definition.
 * @param {Object}  attributes Current block attributes.
 * @param {Array}   path       Object property accessor path.
 */
function replaceReactAttribute( isToReact, schema, attributes, path = [] ) {
	// Recurse into query.
	if ( schema.source === 'query' ) {
		forEach( schema.query, ( querySchema, queryKey ) => {
			// In a query, the value of the attribute is an array, so update
			// path to replace each entry of the array.
			const values = get( attributes, path );
			forEach( values, ( value, index ) => {
				replaceReactAttribute(
					isToReact,
					querySchema,
					attributes,
					[ ...path, index, queryKey ]
				);
			} );
		} );
	}

	// Compat flag assigned during `children` source upgrade shim.
	if ( ! schema._deprecated ) {
		return;
	}

	// Save implementation will expect children as an array shape.
	const value = get( attributes, path );

	let nextValue = value;
	if ( isToReact ) {
		nextValue = [];
		if ( value ) {
			nextValue.push( <RawHTML key="children">{ value }</RawHTML> );
		}
	} else if ( value && typeof value !== 'string' ) {
		// Only render if not already as string. This supports both blocks
		// created in lifetime of application, and those parsed from saved
		// content with already pre-converted sources.
		nextValue = renderToString( value );
	}

	set( attributes, path, nextValue );
}

/**
 * Prepares block attributes to change between expected format for blocks which
 * have not upgraded to drop `children` and `node` sources, i.e. one expecting
 * an element or array of elements.
 *
 * @param {boolean} isToReact  Whether to transform string to React format,
 *                             otherwise from a React format to string.
 * @param {Object}  attributes Current block attributes.
 * @param {string}  name       Block name.
 *
 * @return {Object} Attributes prepared for save.
 */
export function shimReplaceReplaceReactAttributes( isToReact, attributes, name ) {
	const blockType = getBlockType( name );

	// We know mutations will occur if compat flag was assigned during
	// registration to indicate presence of upgraded React source.
	if ( blockType && blockType._compatReactSource ) {
		attributes = cloneDeep( attributes );
		forEach( blockType.attributes, ( schema, key ) => {
			replaceReactAttribute( isToReact, schema, attributes, [ key ] );
		} );
	}

	return attributes;
}

addFilter(
	'blocks.getSaveElement.attributes',
	'core/deprecated/shim-react-serialize',
	partial( shimReplaceReplaceReactAttributes, true )
);

addFilter(
	'blocks.switchToBlockType.sourceAttributes',
	'core/deprecated/shim-react-transform',
	partial( shimReplaceReplaceReactAttributes, true )
);

addFilter(
	'blocks.createBlock.attributes',
	'core/deprecated/shim-create-block-react-attributes',
	partial( shimReplaceReplaceReactAttributes, false )
);

addFilter(
	'blocks.getAttributesFromDeprecatedVersion.migratedBlockAttributes',
	'core/deprecated/shim-migrate-react-attributes',
	partial( shimReplaceReplaceReactAttributes, false )
);
