( function () {
	const registerBlockType = wp.blocks.registerBlockType;
	const createBlock = wp.blocks.createBlock;
	const el = wp.element.createElement;
	const InnerBlocks = wp.blockEditor.InnerBlocks;
	const useState = window.wp.element.useState;

	const TEMPLATE = [
		[
			'core/paragraph',
			{
				fontSize: 'large',
				content: 'Content…',
			},
		],
	];

	const TEMPLATE_PARAGRAPH_PLACEHOLDER = [
		[
			'core/paragraph',
			{
				fontSize: 'large',
				placeholder: 'Content…',
			},
		],
	];

	const TEMPLATE_TWO_PARAGRAPHS = [
		[
			'core/paragraph',
			{
				fontSize: 'large',
				content: 'One',
			},
		],
		[
			'core/paragraph',
			{
				fontSize: 'large',
				content: 'Two',
			},
		],
	];

	const save = function () {
		return el( InnerBlocks.Content );
	};

	registerBlockType( 'test/test-inner-blocks-no-locking', {
		title: 'Test Inner Blocks no locking',
		icon: 'cart',
		category: 'text',

		edit() {
			return el( InnerBlocks, {
				template: TEMPLATE,
			} );
		},

		save,
	} );

	registerBlockType( 'test/test-inner-blocks-locking-all', {
		title: 'Test InnerBlocks locking all',
		icon: 'cart',
		category: 'text',

		edit() {
			return el( InnerBlocks, {
				template: TEMPLATE,
				templateLock: 'all',
			} );
		},

		save,
	} );

	registerBlockType( 'test/test-inner-blocks-update-locked-template', {
		title: 'Test Inner Blocks update locked template',
		icon: 'cart',
		category: 'text',

		attributes: {
			hasUpdatedTemplate: {
				type: 'boolean',
				default: false,
			},
		},

		edit( props ) {
			const hasUpdatedTemplated = props.attributes.hasUpdatedTemplate;
			return el( 'div', null, [
				el(
					'button',
					{
						onClick() {
							props.setAttributes( { hasUpdatedTemplate: true } );
						},
					},
					'Update template'
				),
				el( InnerBlocks, {
					template: hasUpdatedTemplated
						? TEMPLATE_TWO_PARAGRAPHS
						: TEMPLATE,
					templateLock: 'all',
				} ),
			] );
		},

		save,
	} );

	registerBlockType( 'test/test-inner-blocks-paragraph-placeholder', {
		title: 'Test Inner Blocks Paragraph Placeholder',
		icon: 'cart',
		category: 'text',

		edit() {
			return el( InnerBlocks, {
				template: TEMPLATE_PARAGRAPH_PLACEHOLDER,
				templateInsertUpdatesSelection: true,
			} );
		},

		save,
	} );

	registerBlockType( 'test/test-inner-blocks-transformer-target', {
		title: 'Test Inner Blocks transformer target',
		icon: 'cart',
		category: 'text',

		transforms: {
			from: [
				{
					type: 'block',
					blocks: [
						'test/i-dont-exist',
						'test/test-inner-blocks-no-locking',
						'test/test-inner-blocks-locking-all',
						'test/test-inner-blocks-paragraph-placeholder',
					],
					transform( attributes, innerBlocks ) {
						return createBlock(
							'test/test-inner-blocks-transformer-target',
							attributes,
							innerBlocks
						);
					},
				},
			],
			to: [
				{
					type: 'block',
					blocks: [ 'test/i-dont-exist' ],
					transform( attributes, innerBlocks ) {
						return createBlock(
							'test/test-inner-blocks-transformer-target',
							attributes,
							innerBlocks
						);
					},
				},
			],
		},

		edit() {
			return el( InnerBlocks, {
				template: TEMPLATE,
			} );
		},

		save,
	} );


	function InnerBlocksAsyncTemplateEdit() {
		const [ template, setTemplate ] = useState( [] );

		setInterval( () => {
			setTemplate( TEMPLATE_TWO_PARAGRAPHS );
		}, 1000 );

		return el( InnerBlocks, {
			template,
		} );
	}

	registerBlockType(
		'test/test-inner-blocks-async-template',
		{
			title: 'Test Inner Blocks Async Template',
			icon: 'cart',
			category: 'text',

			edit: InnerBlocksAsyncTemplateEdit,

			// Purposely do not save inner blocks so that it's possible to test template resolution.
			save() {},
		}
	);
} )();
