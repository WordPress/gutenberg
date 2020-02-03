module.exports = {
	meta: {
		type: 'problem',
		schema: [],
	},
	create( context ) {
		return {
			"JSXOpeningElement[name.name='BaseControl']": ( node ) => {
				const containsAttribute = ( attrName ) => {
					return node.attributes.some( ( attribute ) => {
						return (
							attribute.name && attribute.name.name === attrName
						);
					} );
				};
				if (
					containsAttribute( 'label' ) &&
					! containsAttribute( 'id' )
				) {
					context.report( {
						node,
						message:
							'When using BaseControl component if a label property is passed an id property should also be passed.',
					} );
				}
			},
		};
	},
};
