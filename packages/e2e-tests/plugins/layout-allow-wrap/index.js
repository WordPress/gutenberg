( function () {
	const registerBlockType = wp.blocks.registerBlockType;
	const el = wp.element.createElement;
	const InnerBlocks = wp.blockEditor.InnerBlocks;
	const useBlockProps = wp.blockEditor.useBlockProps;

	// Base block configuration for flex layout containers.
	function Edit() {
		const blockProps = useBlockProps( {
			style: { outline: '1px solid gray', padding: 10 },
		} );
		return el( 'div', blockProps, el( InnerBlocks ) );
	}

	function Save() {
		const blockProps = useBlockProps.save( {
			style: { outline: '1px solid gray', padding: 10 },
		} );
		return el( 'div', blockProps, el( InnerBlocks.Content ) );
	}

	const baseBlock = {
		icon: 'columns',
		category: 'design',
		edit: Edit,
		save: Save,
	};

	// Block with flex layout and allowWrap: true (default behavior).
	// The wrap toggle should be visible.
	registerBlockType( 'test/layout-allow-wrap-true', {
		...baseBlock,
		title: 'Test Layout Allow Wrap True',
		supports: {
			layout: {
				allowSwitching: false,
				allowOrientation: false,
				allowJustification: false,
				allowWrap: true,
				default: {
					type: 'flex',
				},
			},
		},
	} );

	// Block with flex layout and allowWrap: false.
	// The wrap toggle should NOT be visible.
	registerBlockType( 'test/layout-allow-wrap-false', {
		...baseBlock,
		title: 'Test Layout Allow Wrap False',
		supports: {
			layout: {
				allowSwitching: false,
				allowOrientation: false,
				allowJustification: false,
				allowWrap: false,
				default: {
					type: 'flex',
				},
			},
		},
	} );

	// Block with flex layout, allowWrap: false, and flexWrap: nowrap default.
	// The wrap toggle should NOT be visible, and items should not wrap.
	registerBlockType( 'test/layout-allow-wrap-false-nowrap', {
		...baseBlock,
		title: 'Test Layout Allow Wrap False Nowrap',
		supports: {
			layout: {
				allowSwitching: false,
				allowOrientation: false,
				allowJustification: false,
				allowWrap: false,
				default: {
					type: 'flex',
					flexWrap: 'nowrap',
				},
			},
		},
	} );
} )();
