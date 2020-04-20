/**
 * External dependencies
 */
import cssTree from 'css-tree';
import { map, some } from 'lodash';
import ltrim from 'ltrim';

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
	const wrapperClassNameCleaned = ltrim( wrapperClassName, '.' );

	const wrapperSelector = cssTree.fromPlainObject( {
		type: 'ClassSelector',
		name: wrapperClassNameCleaned,
	} );

	const output = map( styles, ( { css } ) => {
		const ast = cssTree.parse( css );

		cssTree.walk( ast, ( node, item, list ) => {
			if (
				! some( ROOT_SELECTORS, { type: node.type, name: node.name } )
			)
				return;

			const wrapperSelectorItem = list.createItem( wrapperSelector );
			list.replace( item, wrapperSelectorItem );
		} );

		return cssTree.generate( ast );
	} );

	return output;
};

export default transformStyles;
