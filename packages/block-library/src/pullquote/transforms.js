import { createBlock } from '@wordpress/blocks';
import { create, join, toHTMLString } from '@wordpress/rich-text';

/**
 * Gets the cite of a blockquote child that is a citation: a cite, or a
 * paragraph holding only a cite, as autop leaves it.
 *
 * @param {Element} element A child of the pullquote's blockquote.
 *
 * @return {?Element} The cite, if the child holds a citation.
 */
function getCitation( element ) {
	if ( element.nodeName === 'CITE' ) {
		return element;
	}
	const [ cite ] = element.children;
	if (
		element.nodeName === 'P' &&
		element.children.length === 1 &&
		cite.nodeName === 'CITE' &&
		element.textContent.trim() === cite.textContent.trim()
	) {
		return cite;
	}
	return null;
}

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/paragraph' ],
			transform: ( attributes ) => {
				return createBlock( 'core/pullquote', {
					value: toHTMLString( {
						value: join(
							attributes.map( ( { content } ) =>
								create( { html: content } )
							),
							'\n'
						),
					} ),
					anchor: attributes.anchor,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/heading' ],
			transform: ( { content, anchor } ) => {
				return createBlock( 'core/pullquote', {
					value: content,
					anchor,
				} );
			},
		},
		{
			type: 'raw',
			isMatch: ( node ) => {
				if (
					node.nodeName !== 'FIGURE' ||
					! node.classList.contains( 'wp-block-pullquote' ) ||
					node.hasAttribute( 'style' )
				) {
					return false;
				}
				// Only convert markup the block can hold without losing any of
				// it: plain paragraphs and one trailing citation.
				const blockquote = node.querySelector( ':scope > blockquote' );
				if (
					! blockquote ||
					blockquote.hasAttribute( 'style' ) ||
					blockquote.hasAttribute( 'class' ) ||
					! Array.from( node.childNodes ).every(
						( child ) =>
							child === blockquote ||
							( child.nodeType === child.TEXT_NODE &&
								! child.textContent.trim() )
					)
				) {
					return false;
				}
				const children = Array.from( blockquote.children );
				return children.every( ( child, index ) => {
					if ( child.attributes.length ) {
						return false;
					}
					const cite = getCitation( child );
					if ( ! cite ) {
						return child.nodeName === 'P';
					}
					return (
						index === children.length - 1 &&
						! cite.attributes.length
					);
				} );
			},
			transform: ( node ) => {
				const blockquote = node.querySelector( ':scope > blockquote' );
				const paragraphs = Array.from( blockquote.children );
				const last = paragraphs.at( -1 );
				const citation = last && getCitation( last );
				if ( citation ) {
					paragraphs.pop();
				}
				const value = paragraphs
					.map( ( paragraph ) => paragraph.innerHTML.trim() )
					.filter( Boolean )
					.join( '<br>' );
				const alignMatches =
					/(?:^|\s)align(left|right|wide|full)(?:$|\s)/.exec(
						node.className
					);
				return createBlock( 'core/pullquote', {
					value,
					citation: citation ? citation.innerHTML : undefined,
					align: alignMatches ? alignMatches[ 1 ] : undefined,
				} );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( { value, citation } ) => {
				const paragraphs = [];
				if ( value ) {
					paragraphs.push(
						createBlock( 'core/paragraph', {
							content: value,
						} )
					);
				}
				if ( citation ) {
					paragraphs.push(
						createBlock( 'core/paragraph', {
							content: citation,
						} )
					);
				}
				if ( paragraphs.length === 0 ) {
					return createBlock( 'core/paragraph', {
						content: '',
					} );
				}
				return paragraphs;
			},
		},
		{
			type: 'block',
			blocks: [ 'core/heading' ],
			transform: ( { value, citation } ) => {
				// If there is no pullquote content, use the citation as the
				// content of the resulting heading. A nonexistent citation
				// will result in an empty heading.
				if ( ! value ) {
					return createBlock( 'core/heading', {
						content: citation,
					} );
				}
				const headingBlock = createBlock( 'core/heading', {
					content: value,
				} );
				if ( ! citation ) {
					return headingBlock;
				}
				return [
					headingBlock,
					createBlock( 'core/heading', {
						content: citation,
					} ),
				];
			},
		},
	],
};

export default transforms;
