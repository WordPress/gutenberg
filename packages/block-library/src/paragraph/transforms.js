import { createBlock, getBlockAttributes } from '@wordpress/blocks';
import metadata from './block.json';

const { name } = metadata;

const transforms = {
	from: [
		{
			type: 'raw',
			// Paragraph is a fallback and should be matched last.
			priority: 20,
			selector: 'p',
			schema: ( { phrasingContentSchema, isPaste } ) => ( {
				p: {
					children: phrasingContentSchema,
					attributes: isPaste ? [] : [ 'style', 'id' ],
				},
			} ),
			transform( node ) {
				const attributes = getBlockAttributes( name, node.outerHTML );
				const { textAlign } = node.style || {};

				if (
					textAlign === 'left' ||
					textAlign === 'center' ||
					textAlign === 'right'
				) {
					attributes.style = {
						...attributes.style,
						typography: {
							...attributes.style?.typography,
							textAlign,
						},
					};
				}

				return createBlock( name, attributes );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/image' ],
			isMatch: ( { content } ) => {
				const div = document.createElement( 'div' );
				div.innerHTML = content;

				const images = div.querySelectorAll( 'img' );
				const hasOnlyImages =
					images.length === 1 &&
					div.childNodes.length === 1 &&
					div.textContent.trim() === '';

				return hasOnlyImages;
			},
			transform: ( { content, align } ) => {
				const div = document.createElement( 'div' );
				div.innerHTML = content;

				const img = div.querySelector( 'img' );

				const url = img.getAttribute( 'src' );
				const alt = img.getAttribute( 'alt' );
				const title = img.getAttribute( 'title' );
				const width = img.getAttribute( 'width' );
				const height = img.getAttribute( 'height' );
				const className = img.getAttribute( 'class' );

				return createBlock( 'core/image', {
					url,
					alt: alt || '',
					title: title || '',
					align,
					width: width ? parseInt( width, 10 ) : undefined,
					height: height ? parseInt( height, 10 ) : undefined,
					className: className || '',
					linkDestination:
						img.parentNode.tagName === 'A' ? 'custom' : undefined,
					href:
						img.parentNode.tagName === 'A'
							? img.parentNode.getAttribute( 'href' )
							: undefined,
				} );
			},
		},
	],
};

export default transforms;
