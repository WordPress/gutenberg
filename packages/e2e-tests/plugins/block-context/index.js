( function () {
	const { createElement: el } = wp.element;
	const { registerBlockType } = wp.blocks;
	const { InnerBlocks, useBlockProps, useInnerBlocksProps } = wp.blockEditor;

	registerBlockType( 'gutenberg/test-context-provider', {
		apiVersion: 3,
		title: 'Test Context Provider',

		icon: 'list-view',

		// TODO: While redundant with server-side registration, it's required
		// to assign this value since it is not picked in the implementation of
		// `get_block_editor_server_block_settings`.
		providesContext: {
			'gutenberg/recordId': 'recordId',
		},

		category: 'text',

		edit: function Edit( { attributes, setAttributes } ) {
			const blockProps = useBlockProps();
			const innerBlocksProps = useInnerBlocksProps( blockProps, {
				template: [ [ 'gutenberg/test-context-consumer', {} ] ],
				templateLock: 'all',
				templateInsertUpdatesSelection: true,
			} );
			return el(
				'div',
				innerBlocksProps,
				el( 'input', {
					value: attributes.recordId,
					onChange( event ) {
						setAttributes( {
							recordId: Number( event.currentTarget.value ),
						} );
					},
				} ),
				innerBlocksProps.children
			);
		},

		save() {
			return el( InnerBlocks.Content );
		},
	} );

	registerBlockType( 'gutenberg/test-context-consumer', {
		apiVersion: 3,
		title: 'Test Context Consumer',

		icon: 'list-view',

		// TODO: While redundant with server-side registration, it's required
		// to assign this value since it is not picked in the implementation of
		// `get_block_editor_server_block_settings`.
		usesContext: [ 'gutenberg/recordId' ],

		category: 'text',

		edit: function Edit( { context } ) {
			const blockProps = useBlockProps();
			return el(
				'div',
				blockProps,
				'The record ID is: ' + context[ 'gutenberg/recordId' ]
			);
		},

		save() {
			return null;
		},
	} );
} )();
