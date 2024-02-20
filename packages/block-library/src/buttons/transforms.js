/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { __unstableCreateElement as createElement } from '@wordpress/rich-text';

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/button' ],
			transform: ( buttons ) =>
				// Creates the buttons block.
				createBlock(
					'core/buttons',
					{},
					// Loop the selected buttons.
					buttons.map( ( attributes ) =>
						// Create singular button in the buttons block.
						createBlock( 'core/button', attributes )
					)
				),
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
						const { content, metadata } = attributes;
						const element = createElement( document, content );
						// Remove any HTML tags.
						const text = element.innerText || '';
						// Get first url.
						const link = element.querySelector( 'a' );
						const url = link?.getAttribute( 'href' );
						// Transform metadata object for button block.
						let buttonMetadata;
						if ( metadata ) {
							// Only transform these metadata props.
							const supportedProps = [ 'id', 'name', 'bindings' ];
							buttonMetadata = Object.entries( metadata ).reduce(
								( obj, [ prop, value ] ) => {
									if ( supportedProps.includes( prop ) ) {
										obj[ prop ] =
											prop === 'bindings'
												? { text: value.content }
												: value;
									}
									return obj;
								},
								{}
							);
						}
						// Create singular button in the buttons block.
						return createBlock( 'core/button', {
							text,
							url,
							metadata: buttonMetadata,
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
