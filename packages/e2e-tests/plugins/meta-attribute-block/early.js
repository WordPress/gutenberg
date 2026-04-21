( function () {
	const registerBlockType = wp.blocks.registerBlockType;
	const el = wp.element.createElement;
	const { useBlockProps } = wp.blockEditor;

	registerBlockType( 'test/test-meta-attribute-block-early', {
		apiVersion: 3,
		title: 'Test Meta Attribute Block (Early Registration)',
		icon: 'star',
		category: 'text',

		attributes: {
			content: {
				type: 'string',
				source: 'meta',
				meta: 'my_meta',
			},
		},

		edit: function Edit( props ) {
			const blockProps = useBlockProps( {
				className: 'my-meta-input',
				value: props.attributes.content,
				onChange( event ) {
					props.setAttributes( { content: event.target.value } );
				},
			} );
			return el( 'input', blockProps );
		},

		save() {
			return null;
		},
	} );
} )();
