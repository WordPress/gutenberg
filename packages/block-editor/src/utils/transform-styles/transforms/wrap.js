/**
 * External dependencies
 */
import csstree from 'css-tree';
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

const WHITESPACE_CSS = csstree.fromPlainObject( {
	type: 'WhiteSpace',
	value: ' ',
} );

const wrap = function( namespace, ignore = [] ) {
	const namespaceCleaned = trimClassnameDot( namespace ); // ensure a pure classname without `.`
	const wrapperSelector = csstree.fromPlainObject( {
		type: 'ClassSelector',
		name: namespaceCleaned,
	} );

	return function( node, item, list ) {
		// prepend wrapper to selectors that start with non-root selectors
		if ( node.type === 'Selector' ) {
			const firstChildNode = node.children.first();

			// skip selectors that ...
			if (
				// ... contain ignorable nodes as first child
				some( ignore, {
					type: firstChildNode.type,
					name: firstChildNode.name,
				} ) ||
				// ... start with root selectors
				some( ROOT_SELECTORS, {
					type: firstChildNode.type,
					name: firstChildNode.name,
				} ) ||
				// ... start with keyframe specific selectors
				firstChildNode.name === 'from' ||
				firstChildNode.name === 'to'
			)
				return;

			// add white space between wrapper selector + existing selector
			const whitespaceCssItem = node.children.createItem(
				WHITESPACE_CSS
			);
			node.children.prepend( whitespaceCssItem );

			const wrapperSelectorItem = node.children.createItem(
				wrapperSelector
			);
			node.children.prepend( wrapperSelectorItem );
		}

		// replace the root selectors with wrapper selectors
		if (
			// must not be an ignorable selector
			! some( ignore, { type: node.type, name: node.name } ) &&
			// must be a root selector
			some( ROOT_SELECTORS, { type: node.type, name: node.name } )
		) {
			const wrapperSelectorItem = list.createItem( wrapperSelector );
			list.replace( item, wrapperSelectorItem );
		}
	};
};

const trimClassnameDot = ( str ) => {
	if ( str.trim().charAt( 0 ) !== '.' ) return str;
	return str.substring( 1 );
};

export default wrap;
