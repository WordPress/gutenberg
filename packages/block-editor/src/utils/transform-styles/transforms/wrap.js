/**
 * External dependencies
 */
import CSSwhat from 'css-what';

/**
 * Internal dependencies
 */
import {
	createWrapperSelectorAst,
	cssSelectorAstInArray,
} from '../parse/ast.js';

function recursivelyWrapRules(
	cssRules,
	wrapperSelectorAst,
	ignoreSelectorsAsts
) {
	for ( const cssRule of cssRules ) {
		if ( cssRule.cssRules ) {
			recursivelyWrapRules(
				cssRule.cssRules,
				wrapperSelectorAst,
				ignoreSelectorsAsts
			);
		}

		if ( ! cssRule.selectorText ) {
			continue;
		}
		wrapRule( cssRule, wrapperSelectorAst, ignoreSelectorsAsts );
	}
}

function wrapRule( cssRule, wrapperSelectorAst, ignoreSelectorsAsts ) {
	const cssSelectorsAst = CSSwhat.parse( cssRule.selectorText );

	// exclude ignored selectors
	// @TODO

	// all selectors (`,`)
	const newCssSelectorsAst = [];
	for ( const cssSelectorAst of cssSelectorsAst ) {
		const cssSelectorIgnored = cssSelectorAstInArray(
			cssSelectorAst,
			ignoreSelectorsAsts
		);
		if ( cssSelectorIgnored ) {
			continue;
		}

		const newWrapperSelectorAst = Array.from( wrapperSelectorAst ); // copy
		const newCssSelectorAst =
			newWrapperSelectorAst[ 0 ].concat( cssSelectorAst ); // prepend
		newCssSelectorsAst.push( newCssSelectorAst );
	}

	const newCssSelectorStr = CSSwhat.stringify( newCssSelectorsAst );
	cssRule.selectorText = newCssSelectorStr;
}

/**
 * Creates a callback to modify selectors so they only apply within a certain
 * namespace.
 *
 * @param {string}   namespace Namespace to prefix selectors with.
 * @param {string[]} ignore    Selectors to not prefix.
 *
 * @return {(cssstyleSheet: CSSStyleSheet) => Object} Callback to wrap selectors.
 */
const wrap =
	( namespace, ignore = [] ) =>
	( cssstyleSheet ) => {
		const wrapperSelectorAst = createWrapperSelectorAst( namespace ); // (double-nested selector AST)
		const ignoreSelectorsAsts = ignore.map( createWrapperSelectorAst );

		recursivelyWrapRules(
			cssstyleSheet.cssRules,
			wrapperSelectorAst,
			ignoreSelectorsAsts
		);
	};

export default wrap;
