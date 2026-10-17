import { createBlock } from '@wordpress/blocks';
import { __unstableCreateElement as createElement } from '@wordpress/rich-text';
import { getTransformedAttributes } from '../utils/get-transformed-attributes';

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/button' ],
			transform: ( buttons ) => {
				// Move align from the first button to the outer wrapper.
				// core/button does not support align; it belongs on core/buttons.
				const { align } = buttons[ 0 ];
				return createBlock(
					'core/buttons',
					align ? { align } : {},
					buttons.map( ( { align: _align, ...buttonAttributes } ) =>
						createBlock( 'core/button', buttonAttributes )
					)
				);
			},
		},
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/paragraph' ],
			transform: ( buttons ) =>
				// Creates the buttons block.
				createBlock(
					'core/buttons',
					{},
					// Loop the selected buttons.
					buttons.map( ( attributes ) => {
						const { content } = attributes;
						const element = createElement( document, content );
						// Remove any HTML tags.
						const text = element.innerText || '';
						// Get first url.
						const link = element.querySelector( 'a' );
						const url = link?.getAttribute( 'href' );
						// Create singular button in the buttons block.
						return createBlock( 'core/button', {
							...attributes,
							...getTransformedAttributes(
								attributes,
								'core/button',
								( { content: contentBinding } ) => ( {
									text: contentBinding,
								} )
							),
							text,
							url,
						} );
					} )
				),
			isMatch: ( paragraphs ) => {
				return paragraphs.every( ( attributes ) => {
					const element = createElement(
						document,
						attributes.content
					);
					const text = element.innerText || '';
					const links = element.querySelectorAll( 'a' );
					return text.length <= 30 && links.length <= 1;
				} );
			},
		},
	],
};

export default transforms;
