/**
 * External dependencies
 */
import * as CSSwhat from 'css-what';

/**
 * Internal dependencies
 */
import {
	cssSelectorAstInArray,
	createWrapperSelectorAst,
} from '../parse/ast.js';

const ROOT_SELECTORS_STRS = [ 'html', 'body', ':root' ];
const ROOT_SELECTORS = ROOT_SELECTORS_STRS.map( ( rootSelectorStr ) =>
	CSSwhat.parse( rootSelectorStr )
);

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
	( cssRule ) => {
		if ( ! cssRule.selectorText ) {
			return cssRule;
		}

		const wrapperSelectorAst = createWrapperSelectorAst( namespace ); // (double-nested)
		const ignoreSelectorsAsts = ignore.map( ( ignoredSelector ) =>
			CSSwhat.parse( ignoredSelector )
		);

		const cssSelectorsAst = CSSwhat.parse( cssRule.selectorText );

		// all selectors (`,`)
		const newCssSelectorsAst = [];
		for ( const cssSelectorAst of cssSelectorsAst ) {
			const cssSelectorIgnored = cssSelectorAstInArray(
				cssSelectorAst,
				ignoreSelectorsAsts.concat( ROOT_SELECTORS )
			);
			if ( cssSelectorIgnored ) {
				newCssSelectorsAst.push( cssSelectorAst );
				continue; // skip wrapping
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
