/**
 * Rendering a component definition with React: its variants, the element its
 * `render` mapping describes, and the examples.
 */
import { createElement } from 'react';

/**
 * The placeholder rendered in place of a slot prop.
 *
 * @param {string} name Prop name.
 * @return {string} Placeholder.
 */
export const getSlotPlaceholder = ( name ) => `__wpuislot_${ name }__`;

/**
 * The placeholder rendered in place of a string React translates, such as
 * Notice's "Dismiss" label.
 *
 * @param {number} index Index of the string in the build's list.
 * @return {string} Placeholder.
 */
export const getTextPlaceholder = ( index ) => `__wpuitext_${ index }__`;

/**
 * Lists the variants of a component: props with a fixed set of values.
 *
 * @param {Object} component Component definition.
 * @return {Array<{prop: string, values: Array}>} Variants.
 */
export function getVariants( component ) {
	const variants = [];
	for ( const [ prop, schema ] of Object.entries( component.props ) ) {
		if ( Array.isArray( schema.enum ) && ! schema.slot ) {
			variants.push( { prop, values: schema.enum } );
		} else if ( schema.type === 'boolean' ) {
			variants.push( { prop, values: [ false, true ] } );
		}
	}
	return variants;
}

/**
 * Builds the snapshot key for one combination of variant values. PHP builds
 * the same key from the props it's given.
 *
 * @param {Array}  variants Variants.
 * @param {Object} values   Value per variant prop.
 * @return {string} Key.
 */
export function getSnapshotKey( variants, values ) {
	return variants
		.map( ( { prop } ) => `${ prop }=${ values[ prop ] }` )
		.join( '&' );
}

/**
 * Yields every combination of variant values.
 *
 * @param {Array} variants Variants.
 * @yield {Object} Value per variant prop.
 */
export function* getCombinations( variants ) {
	if ( ! variants.length ) {
		yield {};
		return;
	}
	const [ first, ...rest ] = variants;
	for ( const value of first.values ) {
		for ( const combination of getCombinations( rest ) ) {
			yield { [ first.prop ]: value, ...combination };
		}
	}
}

/**
 * Creates the React element a component definition describes.
 *
 * @param {unknown} node   Node of the `render` definition.
 * @param {Object}  values Value per prop: real values for variants, and
 *                         placeholders for slots.
 * @param {Object}  ui     The built `@wordpress/ui` exports.
 * @return {unknown} React node.
 */
export function createNode( node, values, ui ) {
	if ( typeof node === 'string' ) {
		return node.startsWith( '$' ) ? values[ node.slice( 1 ) ] : node;
	}

	if ( Array.isArray( node ) ) {
		const [ type, props, ...children ] = node;
		let elementType = type.startsWith( '$' )
			? values[ type.slice( 1 ) ]
			: type;
		if ( /^[A-Z]/.test( elementType ) ) {
			elementType = elementType
				.split( '.' )
				.reduce( ( object, key ) => object?.[ key ], ui );
			if ( ! elementType ) {
				throw new Error( `@wordpress/ui has no export "${ type }".` );
			}
		}
		return createElement(
			elementType,
			Object.fromEntries(
				Object.entries( props ?? {} ).map( ( [ key, value ] ) => [
					key,
					createNode( value, values, ui ),
				] )
			),
			...children.map( ( child ) => createNode( child, values, ui ) )
		);
	}

	// Nested prop values, such as `style`.
	if ( node && typeof node === 'object' ) {
		return Object.fromEntries(
			Object.entries( node ).map( ( [ key, value ] ) => [
				key,
				createNode( value, values, ui ),
			] )
		);
	}

	return node;
}

/**
 * Lists the cases the preview page and the checks use for a component: its
 * `example` props, and the example with each variant value changed.
 *
 * @param {Object} component Component definition.
 * @param {Array}  variants  Variants.
 * @return {Array<{name: string, props: Object}>} Cases.
 */
export function getExampleCases( component, variants ) {
	const example = component.example ?? {};
	const cases = [ { name: 'example', props: example } ];

	for ( const { prop, values } of variants ) {
		const current = example[ prop ] ?? component.props[ prop ].default;
		for ( const value of values ) {
			if ( value !== current ) {
				cases.push( {
					name: `${ prop }: ${ value }`,
					props: { ...example, [ prop ]: value },
				} );
			}
		}
	}

	return cases;
}

/**
 * Returns a function that removes, from rendered HTML, the attributes React
 * writes for props it doesn't read: a prop of the `render` mapping that comes
 * out as an attribute of the same name, other than real HTML attributes.
 *
 * @param {Object} component Component definition.
 * @return {(html: string) => string} Remover.
 */
export function getUnreadPropRemover( component ) {
	const htmlAttributes = new Set( [
		'type',
		'disabled',
		'hidden',
		'open',
		'checked',
		'value',
		'name',
		'href',
		'role',
	] );
	const reactProps = new Set();
	JSON.stringify( component.render, ( key, value ) => {
		if (
			typeof value === 'string' &&
			value.startsWith( '$' ) &&
			/^[a-z][a-zA-Z]*$/.test( key ) &&
			! htmlAttributes.has( key )
		) {
			reactProps.add( key.toLowerCase() );
		}
		return value;
	} );

	return ( html ) =>
		html.replace( / ([a-z][a-z-]*)="[^"]*"/g, ( match, name ) =>
			reactProps.has( name ) ? '' : match
		);
}

/**
 * Values to render the slots with: a placeholder for each string prop, filled
 * in by PHP.
 *
 * @param {Object} component Component definition.
 * @return {Object} Value per slot prop.
 */
export function getSlotValues( component ) {
	const values = {};
	for ( const [ prop, schema ] of Object.entries( component.props ) ) {
		if ( schema.type === 'string' ) {
			values[ prop ] = getSlotPlaceholder( prop );
		}
	}
	return values;
}

/**
 * Values to render an example with: its props, and the defaults for the rest.
 *
 * @param {Object} component Component definition.
 * @param {Object} props     Example props.
 * @return {Object} Value per prop.
 */
export function getExampleValues( component, props ) {
	const values = {};
	for ( const [ prop, schema ] of Object.entries( component.props ) ) {
		values[ prop ] = props[ prop ] ?? schema.default;
	}
	return values;
}
