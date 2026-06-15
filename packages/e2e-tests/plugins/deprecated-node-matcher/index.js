( function () {
	const registerBlockType = wp.blocks.registerBlockType;
	const { useBlockProps, RichText } = wp.blockEditor;
	const el = wp.element.createElement;

	registerBlockType( 'core/deprecated-children-matcher', {
		apiVersion: 3,
		title: 'Deprecated Children Matcher',
		attributes: {
			value: {
				type: 'array',
				source: 'children',
				selector: 'p',
			},
		},
		category: 'text',
		edit: function EditChildrenMatcher( { attributes, setAttributes } ) {
			return el( RichText, {
				tagName: 'p',
				value: attributes.value,
				onChange( nextValue ) {
					setAttributes( { value: nextValue } );
				},
				...useBlockProps(),
			} );
		},
		save( { attributes } ) {
			return el( RichText.Content, {
				tagName: 'p',
				value: attributes.value,
				...useBlockProps.save(),
			} );
		},
	} );

	function toRichTextValue( value ) {
		return value?.map( ( { children } ) => children ) ?? [];
	}

	function fromRichTextValue( value ) {
		return value.map( ( subValue ) => ( { children: subValue } ) );
	}

	registerBlockType( 'core/deprecated-node-matcher', {
		apiVersion: 3,
		title: 'Deprecated Node Matcher',
		attributes: {
			value: {
				type: 'array',
				source: 'query',
				selector: 'blockquote > p',
				query: {
					children: {
						source: 'node',
					},
				},
			},
		},
		category: 'text',
		edit: function EditNodeMatcher( { attributes, setAttributes } ) {
			return el(
				'blockquote',
				useBlockProps(),
				el( RichText, {
					multiline: 'p',
					value: toRichTextValue( attributes.value ),
					onChange( nextValue ) {
						setAttributes( {
							value: fromRichTextValue( nextValue ),
						} );
					},
				} )
			);
		},
		save( { attributes } ) {
			return el(
				'blockquote',
				useBlockProps.save(),
				el( RichText.Content, {
					value: toRichTextValue( attributes.value ),
				} )
			);
		},
	} );
} )();
