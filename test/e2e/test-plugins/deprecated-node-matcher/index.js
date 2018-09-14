( function() {
	var registerBlockType = wp.blocks.registerBlockType;
	var RichText = wp.editor.RichText;
	var el = wp.element.createElement;
	var el = wp.element.createElement;

	function toRichTextValue( value ) {
		return _.map( value, function( subValue ) {
			return subValue.children;
		} );
	}

	function fromRichTextValue( value ) {
		return _.map( value, function( subValue ) {
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
		category: 'formatting',
		edit: function( { attributes, setAttributes } ) {
			return el( 'blockquote', {},
				el( RichText, {
					multiline: 'p',
					value: toRichTextValue( attributes.value ),
					onChange: function( nextValue ) {
						setAttributes( {
							value: fromRichTextValue( nextValue ),
						} );
					},
				} )
			);
		},
		save: function( { attributes } ) {
			return el( 'blockquote', {},
				el( RichText.Content, {
					value: toRichTextValue( attributes.value ),
				} )
			);
		},
	} );
} )();

