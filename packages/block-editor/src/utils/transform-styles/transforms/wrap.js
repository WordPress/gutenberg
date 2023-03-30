/**
 * External dependencies
 */
import CSSwhat from 'css-what';

/**
 * Internal dependencies
 */
import {
	cssSelectorAstInArray,
	createWrapperSelectorAst,
} from '../parse/ast.js';

/**
 * Creates a callback to modify selectors so they only apply within a certain
 * namespace.
 *
 * @param {string}   namespace Namespace to prefix selectors with.
 * @param {string[]} ignore    Selectors to not prefix.
 *
 * @return {(cssstyleSheet: CSSStyleSheet) => Object} Callback to wrap selectors.
 */
const wrap = ( namespace, ignore ) => ( cssRule ) => {
	if ( ! cssRule.selectorText ) {
		return cssRule;
	}

	const wrapperSelectorAst = createWrapperSelectorAst( namespace ); // (double-nested)
	const ignoreSelectorsAsts = ignore.map( ( ignoredSelector ) =>
		CSSwhat.parse( ignoredSelector )
	);

	const cssSelectorsAst = CSSwhat.parse( cssRule.selectorText );

	/* if(firstCssSelector.type === 'attribute' ||
		  firstCssSelector.name === 'class'     ||) */

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
};

export default wrap;
