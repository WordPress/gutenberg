( function () {
	const registerBlockType = wp.blocks.registerBlockType;
	const RichText = wp.blockEditor.RichText;
	const el = wp.element.createElement;

	registerBlockType( 'core/deprecated-children-matcher', {
		title: 'Deprecated Children Matcher',
		attributes: {
			value: {
				type: 'array',
				source: 'children',
				selector: 'p',
			},
		},
		category: 'text',
		edit( { attributes, setAttributes } ) {
			return el( RichText, {
				tagName: 'p',
				value: attributes.value,
				onChange( nextValue ) {
					setAttributes( { value: nextValue } );
				},
			} );
		},
		save( { attributes } ) {
			return el( RichText.Content, {
				tagName: 'p',
				value: attributes.value,
			} );
		},
	} );

	function toRichTextValue( value ) {
		// eslint-disable-next-line no-undef
		return _.map( value, function ( subValue ) {
			return subValue.children;
		} );
	}

	function fromRichTextValue( value ) {
		// eslint-disable-next-line no-undef
		return _.map( value, function ( subValue ) {
			return {
				children: subValue,
			};
		} );
	}

	registerBlockType( 'core/deprecated-node-matcher', {
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
		edit( { attributes, setAttributes } ) {
			return el(
				'blockquote',
				{},
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
				{},
				el( RichText.Content, {
					value: toRichTextValue( attributes.value ),
				} )
			);
		},
	} );
} )();
