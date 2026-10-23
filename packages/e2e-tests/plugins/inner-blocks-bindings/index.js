const { registerBlockBindingsSource } = wp.blocks;

const FIELD = 'inner_blocks_field';

registerBlockBindingsSource( {
	name: 'testing/inner-blocks-field',
	getValues( { select, context } ) {
		const value = select( 'core' ).getEditedEntityRecord(
			'postType',
			context?.postType,
			context?.postId
		)?.meta?.[ FIELD ];
		// An empty field has no inner blocks to supply.
		return { innerBlocks: value || undefined };
	},
	setValues( { dispatch, context, bindings } ) {
		dispatch( 'core' ).editEntityRecord(
			'postType',
			context?.postType,
			context?.postId,
			{ meta: { [ FIELD ]: bindings.innerBlocks.newValue } }
		);
	},
	canUserEditValue: ( { context } ) => !! context?.postId,
} );
