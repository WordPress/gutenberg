const { registerBlockBindingsSource } = wp.blocks;
const { escapeHTML } = wp.escapeHtml;

registerBlockBindingsSource( {
	name: 'testing/inner-blocks',
	getValues( { bindings } ) {
		const text = bindings.innerBlocks?.args?.text;
		return {
			innerBlocks:
				typeof text === 'string'
					? `<!-- wp:paragraph --><p>${ escapeHTML(
							text
						) }</p><!-- /wp:paragraph -->`
					: undefined,
		};
	},
} );
