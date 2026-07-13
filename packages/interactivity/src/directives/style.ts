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
 * Converts a css style string into a object.
 *
 * Made by Cristian Bote (@cristianbote) for Goober.
 * https://unpkg.com/browse/goober@2.1.13/src/core/astish.js
 *
 * @param val CSS string.
 * @return CSS object.
 */
const cssStringToObject = (
	val: string
): Record< string, string | number > => {
	const tree = [ {} ];
	let block, left;

	while ( ( block = newRule.exec( val.replace( ruleClean, '' ) ) ) ) {
		if ( block[ 4 ] ) {
			tree.shift();
		} else if ( block[ 3 ] ) {
			left = block[ 3 ].replace( ruleNewline, empty ).trim();
			tree.unshift( ( tree[ 0 ][ left ] = tree[ 0 ][ left ] || {} ) );
		} else {
			tree[ 0 ][ block[ 1 ] ] = block[ 2 ]
				.replace( ruleNewline, empty )
				.trim();
		}
	}

	return tree[ 0 ];
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
		element.props.style = element.props.style || {};
		if ( typeof element.props.style === 'string' ) {
			element.props.style = cssStringToObject( element.props.style );
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
