/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

function createListBlockFromDOMElement( listElement ) {
	const listAttributes = {
		ordered: 'OL' === listElement.tagName,
		start: listElement.getAttribute( 'start' )
			? parseInt( listElement.getAttribute( 'start' ), 10 )
			: undefined,
		reversed:
			listElement.getAttribute( 'reversed' ) === true ? true : undefined,
		type: listElement.getAttribute( 'type' ) ?? undefined,
	};

	const innerBlocks = Array.from( listElement.children ).map(
		( listItem ) => {
			const children = Array.from( listItem.childNodes );
			children.reverse();
			const [ nestedList, ...nodes ] = children;

			const hasNestedList =
				nestedList.tagName === 'UL' || nestedList.tagName === 'OL';
			if ( ! hasNestedList ) {
				return createBlock( 'core/list-item', {
					content: listItem.innerHTML,
				} );
			}
			const htmlNodes = nodes.map( ( node ) => {
				if ( node.nodeType === node.TEXT_NODE ) {
					return node.textContent;
				}
				return node.outerHTML;
			} );
			htmlNodes.reverse();
			const childAttributes = {
				content: htmlNodes.concat( '' ),
			};
			const childInnerBlocks = [
				createListBlockFromDOMElement( nestedList ),
			];
			return createBlock(
				'core/list-item',
				childAttributes,
				childInnerBlocks
			);
		}
	);

	return createBlock( 'core/list', listAttributes, innerBlocks );
}

export function migrateToListV2( attributes ) {
	const { values, start, reversed, ordered, type } = attributes;

	const list = document.createElement( ordered ? 'ol' : 'ul' );
	list.innerHTML = values;
	if ( start ) {
		list.setAttribute( 'start', start );
	}
	if ( reversed ) {
		list.setAttribute( 'reversed', true );
	}
	if ( type ) {
		list.setAttribute( 'type', type );
	}

	const listBlock = createListBlockFromDOMElement( list );

	return [
		{
			...omit( attributes, [ 'values' ] ),
			...listBlock.attributes,
		},
		listBlock.innerBlocks,
	];
}
