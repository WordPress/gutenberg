/**
 * Internal dependencies
 */
import type { CSSRuleState, CSSRule } from './types';

/**
 * Returns a style definition by selector
 *
 * @param {CSSRuleState} state    Global application state.
 * @param {string}       selector
 * @return {CSSRule} Object with error notices.
 */
export function getStyleBySelector(
	state: CSSRuleState,
	selector: string
): CSSRule {
	return state[ selector ];
}

function snakeCase( rule: string ): string {
	return rule.replace( /[A-Z]/g, ( match ) => `-${ match.toLowerCase() }` );
}

function getCssDefinitions( definitions: CSSRule ): string {
	const cssDefinitions: string[] = [];
	for ( const [ key, value ] of Object.entries( definitions ) ) {
		cssDefinitions.push( `${ snakeCase( key ) }: ${ value }` );
	}
	return cssDefinitions.join( '; ' );
}


/**
 * Returns concatenated CSS from the CSSRuleState.
 *
 * @param {CSSRuleState} state Global application state.
 * @return {string} Concatenated CSS
 */

export function getConcatenatedCSSFromStyles( state: CSSRuleState ): string {
	const cssRules: string[] = [];
	for ( const [ key, value ] of Object.entries( state ) ) {
		cssRules.push( `${ key } { ${ getCssDefinitions( value ) } }` );
	}
	return cssRules.join( ' ' );
}
