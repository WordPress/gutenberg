( function() {
	var registerBlockType = wp.blocks.registerBlockType;
	var RichText = wp.editor.RichText;
	var el = wp.element.createElement;
	var el = wp.element.createElement;

	registerBlockType( 'core/deprecated-children-matcher', {
		title: 'Deprecated Children Matcher',
		attributes: {
			value: {
				type: 'array',
				source: 'children',
				selector: 'p',
			},
		},
		category: 'formatting',
		edit: function( { attributes, setAttributes } ) {
			console.log(  attributes.value )
			return el( RichText, {
				tagName: 'p',
				value: attributes.value,
				onChange: function( nextValue ) {
					setAttributes( { value: nextValue } );
				},
			} );
		},
		save: function( { attributes } ) {
			return el( RichText.Content, {
				tagName: 'p',
				value: attributes.value,
			} );
		},
	} );

	function torichText( value ) {
		return _.map( value, function( subValue ) {
			return subValue.children;
		} );
	}

	function fromrichText( value ) {
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
					value: torichText( attributes.value ),
					onChange: function( nextValue ) {
						setAttributes( {
							value: fromrichText( nextValue ),
						} );
					},
				} )
			);
		},
		save: function( { attributes } ) {
			return el( 'blockquote', {},
				el( RichText.Content, {
					value: torichText( attributes.value ),
				} )
			);
		},
	} );
} )();

