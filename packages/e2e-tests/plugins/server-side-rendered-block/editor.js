( function () {
	const { createElement: el, Fragment } = wp.element;
	const { registerBlockType } = wp.blocks;
	const {
		InnerBlocks,
		InspectorControls,
		useBlockProps,
		useInnerBlocksProps,
	} = wp.blockEditor;
	const ServerSideRender = wp.serverSideRender;
	const { PanelBody, __experimentalNumberControl: NumberControl } =
		wp.components;

	registerBlockType( 'test/server-side-rendered-block', {
		apiVersion: 3,
		title: 'Test Server-Side Render',
		icon: 'coffee',
		category: 'text',

		edit: function Edit( { attributes, setAttributes } ) {
			const blockProps = useBlockProps();
			return el(
				Fragment,
				null,
				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						null,
						el( NumberControl, {
							label: 'Count',
							value: attributes.count || 0,
							min: 0,
							max: 10,
							onChange: ( value ) => {
								setAttributes( { count: value } );
							},
						} )
					)
				),
				el(
					'div',
					blockProps,
					el( ServerSideRender, {
						block: 'test/server-side-rendered-block',
						attributes,
					} )
				)
			);
		},
	} );

	registerBlockType( 'test/post-context-provider', {
		apiVersion: 3,
		title: 'Test Post Context Provider',
		icon: 'list-view',
		category: 'text',

		// Redundant with the server-side registration, but required since it
		// is not picked up in `get_block_editor_server_block_settings`.
		providesContext: {
			postId: 'postId',
			postType: 'postType',
		},

		edit: function Edit( { attributes, setAttributes } ) {
			const blockProps = useBlockProps();
			const innerBlocksProps = useInnerBlocksProps( blockProps );
			return el(
				'div',
				innerBlocksProps,
				el( 'input', {
					'aria-label': 'Context post ID',
					value: attributes.postId,
					onChange( event ) {
						setAttributes( {
							postId: Number( event.currentTarget.value ),
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
} )();
