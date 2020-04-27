/**
 * External dependencies
 */
import cssTree from 'css-tree';
import { map, some } from 'lodash';
import ltrim from 'ltrim';
/**
 * Internal dependencies
 */
import trimUrlStr from './trimUrlStr';

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

	return map( styles, ( { css, baseURL } ) => {
		const ast = cssTree.parse( css );

		cssTree.walk( ast, ( node, item, list ) => {
			// wrapper
			if (
				some( ROOT_SELECTORS, { type: node.type, name: node.name } )
			) {
				const wrapperSelectorItem = list.createItem( wrapperSelector );
				list.replace( item, wrapperSelectorItem );
			}

			// baseURL
			if ( baseURL && node.type === 'Url' ) {
				const urlValue = node.value;

				let urlQuote = '';
				let urlValueStr = urlValue.value;
				if ( urlValue.type === 'String' ) {
					// String type nodes have the value always wrapped in quotes (like `'` or `"`)
					const urlValueStrQuoted = urlValue.value;
					urlQuote = urlValueStrQuoted.charAt( 0 );
					urlValueStr = trimUrlStr( urlValueStrQuoted );
				}

				const basedUrl = new URL( urlValueStr, baseURL );
				urlValue.value = urlQuote + basedUrl.toString() + urlQuote;
			}
		} );

		return cssTree.generate( ast );
	} );
};

export default transformStyles;
