( function () {
	const registerBlockType = wp.blocks.registerBlockType;
	const createBlock = wp.blocks.createBlock;
	const el = wp.element.createElement;
	const { InnerBlocks, useBlockProps } = wp.blockEditor;
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
		apiVersion: 3,
		title: 'Test Inner Blocks no locking',
		icon: 'cart',
		category: 'text',

		edit: function InnerBlocksNoLockingEdit() {
			return el( 'div', useBlockProps(), el( InnerBlocks, {
				template: TEMPLATE,
			} ) );
		},

		save,
	} );

	registerBlockType( 'test/test-inner-blocks-locking-all', {
		apiVersion: 3,
		title: 'Test InnerBlocks locking all',
		icon: 'cart',
		category: 'text',

		edit: function InnerBlocksBlocksLockingAllEdit() {
			return el( 'div', useBlockProps(), el( InnerBlocks, {
				template: TEMPLATE,
				templateLock: 'all',
			} ) );
		},

		save,
	} );

	registerBlockType( 'test/test-inner-blocks-update-locked-template', {
		apiVersion: 3,
		title: 'Test Inner Blocks update locked template',
		icon: 'cart',
		category: 'text',

		attributes: {
			hasUpdatedTemplate: {
				type: 'boolean',
				default: false,
			},
		},

		edit: function InnerBlocksUpdateLockedTemplateEdit( props ) {
			const hasUpdatedTemplated = props.attributes.hasUpdatedTemplate;
			return el( 'div', null,
				el(
					'button',
					{
						onClick() {
							props.setAttributes( { hasUpdatedTemplate: true } );
						},
					},
					'Update template'
				),
				el( 'div', useBlockProps(), el( InnerBlocks, {
					template: hasUpdatedTemplated
						? TEMPLATE_TWO_PARAGRAPHS
						: TEMPLATE,
					templateLock: 'all',
				} ) ),
			);
		},

		save,
	} );

	registerBlockType( 'test/test-inner-blocks-paragraph-placeholder', {
		apiVersion: 3,
		title: 'Test Inner Blocks Paragraph Placeholder',
		icon: 'cart',
		category: 'text',

		edit: function InnerBlocksParagraphPlaceholderEdit() {
			return el( 'div', useBlockProps(), el( InnerBlocks, {
				template: TEMPLATE_PARAGRAPH_PLACEHOLDER,
				templateInsertUpdatesSelection: true,
			} ) );
		},

		save,
	} );

	registerBlockType( 'test/test-inner-blocks-transformer-target', {
		apiVersion: 3,
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

		edit: function InnerBlocksTransformerTargetEdit() {
			return el( 'div', useBlockProps(), el( InnerBlocks, {
				template: TEMPLATE,
			} ) );
		},

		save,
	} );

	registerBlockType(
		'test/test-inner-blocks-async-template',
		{
			apiVersion: 3,
			title: 'Test Inner Blocks Async Template',
			icon: 'cart',
			category: 'text',

			edit: function InnerBlocksAsyncTemplateEdit() {
				const [ template, setTemplate ] = useState( [] );

				setInterval( () => {
					setTemplate( TEMPLATE_TWO_PARAGRAPHS );
				}, 1000 );

				return el('div', useBlockProps(), el( InnerBlocks, {
					template,
				} ) );
			},

			// Purposely do not save inner blocks so that it's possible to test template resolution.
			save() {},
		}
	);
} )();
