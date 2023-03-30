/**
 * External dependencies
 */
import CSSwhat from 'css-what';

function cssSelectorAstInArray( objNeedle, arr ) {
	return arr.some(
		( obj ) => JSON.stringify( obj[ 0 ] ) === JSON.stringify( objNeedle )
	);
}

function createWrapperSelectorAst( wrapperSelectorCss ) {
	const wrapperSelectorAst = CSSwhat.parse( wrapperSelectorCss ); // (double-nested)
	wrapperSelectorAst[ 0 ].push( {
		type: 'descendant',
	} );
	return wrapperSelectorAst;
}

function recurseCssRules( cssRule, callback ) {
	if ( ! cssRule.cssRules ) {
		return;
	}
	for ( const subCssRule of cssRule.cssRules ) {
		callback( subCssRule );
		recurseCssRules( subCssRule, callback );
	}
}

export { cssSelectorAstInArray, createWrapperSelectorAst, recurseCssRules };
