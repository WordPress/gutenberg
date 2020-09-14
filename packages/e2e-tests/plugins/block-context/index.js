( function () {
	const { createElement: el, Fragment } = wp.element;
	const { registerBlockType } = wp.blocks;
	const { InnerBlocks } = wp.blockEditor;

	registerBlockType( 'gutenberg/test-context-provider', {
		title: 'Test Context Provider',

		icon: 'list-view',

		// TODO: While redundant with server-side registration, it's required
		// to assign this value since it is not picked in the implementation of
		// `get_block_editor_server_block_settings`.
		providesContext: {
			'gutenberg/recordId': 'recordId',
		},

		category: 'text',

		edit( { attributes, setAttributes } ) {
			return el(
				Fragment,
				null,
				el( 'input', {
					value: attributes.recordId,
					onChange( event ) {
						setAttributes( {
							recordId: Number( event.currentTarget.value ),
						} );
					},
				} ),
				el( InnerBlocks, {
					template: [ [ 'gutenberg/test-context-consumer', {} ] ],
					templateLock: 'all',
				} )
			);
		},

		save() {
			return el( InnerBlocks.Content );
		},
	} );

	registerBlockType( 'gutenberg/test-context-consumer', {
		title: 'Test Context Consumer',

		icon: 'list-view',

		// TODO: While redundant with server-side registration, it's required
		// to assign this value since it is not picked in the implementation of
		// `get_block_editor_server_block_settings`.
		usesContext: [ 'gutenberg/recordId' ],

		category: 'text',

		edit( { context } ) {
			return 'The record ID is: ' + context[ 'gutenberg/recordId' ];
		},

		save() {
			return null;
		},
	} );
} )();
