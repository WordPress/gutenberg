/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock, rawHandler } from '@wordpress/blocks';

export const LIST_STYLE_TYPES = [
	{
		label: __( 'Numbers' ),
		value: 'decimal',
		type: '1',
	},
	{
		label: __( 'Uppercase letters' ),
		value: 'upper-alpha',
		type: 'A',
	},
	{
		label: __( 'Lowercase letters' ),
		value: 'lower-alpha',
		type: 'a',
	},
	{
		label: __( 'Uppercase Roman numerals' ),
		value: 'upper-roman',
		type: 'I',
	},
	{
		label: __( 'Lowercase Roman numerals' ),
		value: 'lower-roman',
		type: 'i',
	},
];

function getListStyleTypeValue( type ) {
	if ( ! type ) {
		return undefined;
	}

	const listStyleType = LIST_STYLE_TYPES.find(
		( item ) => item.type === type
	);

	return listStyleType ? listStyleType.value : undefined;
}

export function createListBlockFromDOMElement( listElement ) {
	const type = listElement.getAttribute( 'type' );
	const listStyleType = getListStyleTypeValue( type );
	const listAttributes = {
		ordered: 'OL' === listElement.tagName,
		anchor: listElement.id === '' ? undefined : listElement.id,
		start: listElement.getAttribute( 'start' )
			? parseInt( listElement.getAttribute( 'start' ), 10 )
			: undefined,
		reversed: listElement.hasAttribute( 'reversed' ) ? true : undefined,
		type:
			listStyleType && listStyleType !== 'decimal'
				? listStyleType
				: undefined,
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

	const listStyleType = getListStyleTypeValue( type );

	if ( listStyleType && listStyleType !== 'decimal' ) {
		return {
			...attributes,
			type: listStyleType || undefined,
		};
	}

	return attributes;
}
