import { type RefObject } from 'preact';
import { directive, isNonDefaultDirectiveSuffix } from '../hooks';
import { useInit } from '../utils';
import { PENDING_GETTER } from '../proxies/state';
import { warnUniqueIdNotSupported } from './utils/warnings';

const newRule =
	/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g;
const ruleClean = /\/\*[^]*?\*\/|  +/g;
const ruleNewline = /\n+/g;
const empty = ' ';

/**
 * Converts a CSS declaration list, like the value of a `style` attribute, into
 * an object that maps each property to its value.
 *
 * Only top-level `property: value;` declarations are read. Nested blocks are
 * skipped, because a `style` attribute can't contain them. The returned object
 * doesn't inherit from `Object.prototype`, so a property name can't reach an
 * inherited value.
 *
 * Based on the parser by Cristian Bote (@cristianbote) for Goober.
 * https://unpkg.com/browse/goober@2.1.13/src/core/astish.js
 *
 * @param val CSS string.
 * @return CSS object.
 */
const cssStringToObject = ( val: string ): Record< string, string > => {
	const result: Record< string, string > = Object.create( null );
	const css = val.replace( ruleClean, '' );
	let depth = 0;
	let block;

	newRule.lastIndex = 0;
	while ( ( block = newRule.exec( css ) ) ) {
		if ( block[ 4 ] !== undefined ) {
			// End of a block.
			depth = Math.max( 0, depth - 1 );
		} else if ( block[ 3 ] !== undefined ) {
			// Start of a nested block. Its content is skipped.
			depth++;
		} else if ( depth === 0 ) {
			result[ block[ 1 ] ] = block[ 2 ]
				.replace( ruleNewline, empty )
				.trim();
		}
	}

	return result;
};

/**
 * Checks whether a value is an object that inherits from `Object.prototype` or
 * has no prototype.
 *
 * @param value The value to check.
 * @return Whether the value is such an object.
 */
const isStyleObject = ( value: unknown ): value is object => {
	if ( typeof value !== 'object' || value === null ) {
		return false;
	}
	const prototype = Object.getPrototypeOf( value );
	return prototype === Object.prototype || prototype === null;
};

/**
 * Copies the own enumerable data properties of an object into an object
 * without a prototype. Accessor properties are skipped, so no getter runs.
 *
 * @param object The object to copy.
 * @return The copy.
 */
const copyDataProperties = ( object: object ): Record< string, any > => {
	const copy = Object.create( null );
	for ( const [ key, desc ] of Object.entries(
		Object.getOwnPropertyDescriptors( object )
	) ) {
		if ( desc.enumerable && 'value' in desc ) {
			copy[ key ] = desc.value;
		}
	}
	return copy;
};

// data-wp-style--[style-property] Dynamic style binding.
directive( 'style', ( { directives: { style }, element, evaluate } ) => {
	style.filter( isNonDefaultDirectiveSuffix ).forEach( ( entry ) => {
		if ( entry.uniqueId ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warnUniqueIdNotSupported( 'style', entry.uniqueId );
			}
			return;
		}
		const styleProp = entry.suffix;
		let result = evaluate( entry );
		if ( result === PENDING_GETTER ) {
			return;
		}
		if ( typeof result === 'function' ) {
			result = result();
		}
		if ( typeof element.props.style === 'string' ) {
			element.props.style = cssStringToObject( element.props.style );
		} else if ( isStyleObject( element.props.style ) ) {
			// Only write into a style object that `data-wp-style` created.
			element.props.style = copyDataProperties( element.props.style );
		} else {
			// `data-wp-bind--style` can set a value that isn't a style.
			element.props.style = Object.create( null ) as Record<
				string,
				string | number
			>;
		}
		if ( ! result ) {
			delete element.props.style[ styleProp ];
		} else {
			element.props.style[ styleProp ] = result;
		}

		useInit( () => {
			/*
			 * This seems necessary because Preact doesn't change the styles on
			 * the hydration, so we have to do it manually. It doesn't need deps
			 * because it only needs to do it the first time.
			 */
			if ( ! result ) {
				(
					element.ref as RefObject< HTMLElement >
				 ).current!.style.removeProperty( styleProp );
			} else {
				(
					element.ref as RefObject< HTMLElement >
				 ).current!.style.setProperty( styleProp, result );
			}
		} );
	} );
} );
