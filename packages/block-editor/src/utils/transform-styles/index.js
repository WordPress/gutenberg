/**
 * External dependencies
 */
import cssTree from 'css-tree';
import { some } from 'lodash';

const ROOT_SELECTORS = [
	{
		// html
		type: 'TypeSelector',
		name: 'html',
	},
	{
		// body
		type: 'TypeSelector',
		name: 'body',
	},
	{
		// :root
		type: 'PseudoClassSelector',
		name: 'root',
	},
];

/**
 * Applies a series of CSS rule transforms to wrap selectors inside a given class and/or rewrite URLs depending on the parameters passed.
 *
 * @param {Array} styles CSS rules.
 * @param {string} wrapperClassName Wrapper Class Name.
 * @return {Array} converted rules.
 */
const transformStyles = ( styles, wrapperClassName = '' ) => {
	const wrapperSelector = cssTree.fromPlainObject( {
		type: 'ClassSelector',
		name: wrapperClassName,
	} );

	const ast = cssTree.parse( styles );

	cssTree.walk( ast, ( node, item, list ) => {
		if ( ! some( ROOT_SELECTORS, { type: node.type, name: node.name } ) )
			return;

		const wrapperSelectorItem = list.createItem( wrapperSelector );
		list.replace( item, wrapperSelectorItem );
	} );

	return cssTree.generate( ast );
};

export default transformStyles;
