( function () {
	const { registerBlockType } = wp.blocks;
	const { createElement: el } = wp.element;
	const { InnerBlocks, useBlockProps, useInnerBlocksProps } = wp.blockEditor;

	const divProps = {
		className: 'product',
		style: { outline: '1px solid gray', padding: 5 },
	};

	// without a placeholder within the inner blocks it can be difficult to select the block using e2e tests
	// especially using Puppeteer, so we use an image block which has a placeholder.
	const template = [ [ 'core/image' ] ];

	const save = function () {
		return el( 'div', divProps, el( InnerBlocks.Content ) );
	};
	registerBlockType( 'test/prioritized-inserter-blocks-unset', {
		apiVersion: 3,
		title: 'Prioritized Inserter Blocks Unset',
		icon: 'carrot',
		category: 'text',

		edit: function Edit() {
			const blockProps = useBlockProps( divProps );
			const innerBlocksProps = useInnerBlocksProps( blockProps, {
				template,
			} );
			return el( 'div', innerBlocksProps );
		},

		save,
	} );

	registerBlockType( 'test/prioritized-inserter-blocks-set', {
		apiVersion: 3,
		title: 'Prioritized Inserter Blocks Set',
		icon: 'carrot',
		category: 'text',
		edit: function Edit() {
			const blockProps = useBlockProps( divProps );
			const innerBlocksProps = useInnerBlocksProps( blockProps, {
				template,
				prioritizedInserterBlocks: [
					'core/audio',
					'core/spacer',
					'core/code',
				],
			} );
			return el( 'div', innerBlocksProps );
		},

		save,
	} );

	registerBlockType(
		'test/prioritized-inserter-blocks-set-with-conflicting-allowed-blocks',
		{
			apiVersion: 3,
			title: 'Prioritized Inserter Blocks Set With Conflicting Allowed Blocks',
			icon: 'carrot',
			category: 'text',
			edit: function Edit() {
				const blockProps = useBlockProps( divProps );
				const innerBlocksProps = useInnerBlocksProps( blockProps, {
					template,
					allowedBlocks: [
						'core/spacer',
						'core/code',
						'core/paragraph',
						'core/heading',
					],
					prioritizedInserterBlocks: [
						'core/audio', // this is **not** in the allowedBlocks list
						'core/spacer',
						'core/code',
					],
				} );
				return el( 'div', innerBlocksProps );
			},

			save,
		}
	);
} )();
