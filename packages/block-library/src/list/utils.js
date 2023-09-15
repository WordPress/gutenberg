/**
 * WordPress dependencies
 */
import { createBlock, rawHandler } from '@wordpress/blocks';

const LIST_STYLES = {
	A: 'upper-alpha',
	a: 'lower-alpha',
	I: 'upper-roman',
	i: 'lower-roman',
};

export function createListBlockFromDOMElement( listElement ) {
	const type = listElement.getAttribute( 'type' );
	const listAttributes = {
		ordered: 'OL' === listElement.tagName,
		anchor: listElement.id === '' ? undefined : listElement.id,
		start: listElement.getAttribute( 'start' )
			? parseInt( listElement.getAttribute( 'start' ), 10 )
			: undefined,
		reversed: listElement.hasAttribute( 'reversed' ) ? true : undefined,
		type: type && LIST_STYLES[ type ] ? LIST_STYLES[ type ] : undefined,
	};

	const innerBlocks = Array.from( listElement.children ).map(
		( listItem ) => {
			const children = Array.from( listItem.childNodes ).filter(
				( node ) =>
					node.nodeType !== node.TEXT_NODE ||
					node.textContent.trim().length !== 0
			);
			children.reverse();
			const [ nestedList, ...nodes ] = children;

			const hasNestedList =
				nestedList?.tagName === 'UL' || nestedList?.tagName === 'OL';
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
				content: htmlNodes.join( '' ).trim(),
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
	const { values, start, reversed, ordered, type, ...otherAttributes } =
		attributes;

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

	const [ listBlock ] = rawHandler( { HTML: list.outerHTML } );

	return [
		{ ...otherAttributes, ...listBlock.attributes },
		listBlock.innerBlocks,
	];
}

export function migrateTypeToInlineStyle( attributes ) {
	const { type } = attributes;

	if ( type && LIST_STYLES[ type ] ) {
		return {
			...attributes,
			type: LIST_STYLES[ type ],
		};
	}

	return attributes;
}
