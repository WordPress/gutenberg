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

export { cssSelectorAstInArray, createWrapperSelectorAst };
