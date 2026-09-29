( function () {
	const registerBlockType = wp.blocks.registerBlockType;
	const el = wp.element.createElement;
	const { useBlockProps } = wp.blockEditor;

	const baseBlock = {
		icon: 'cart',
		category: 'text',
		edit: function Edit() {
			const blockProps = useBlockProps( {
				style: { outline: '1px solid gray', padding: 5 },
			} );
			return el( 'div', blockProps, 'Test Align Hook' );
		},
		save() {
			const blockProps = useBlockProps.save( {
				style: { outline: '1px solid gray', padding: 5 },
			} );
			return el( 'div', blockProps, 'Test Align Hook' );
		},
	};

	registerBlockType(
		'test/test-no-alignment-set',
		Object.assign(
			{
				apiVersion: 3,
				title: 'Test No Alignment Set',
			},
			baseBlock
		)
	);

	registerBlockType(
		'test/test-align-true',
		Object.assign(
			{
				apiVersion: 3,
				title: 'Test Align True',
				supports: {
					align: true,
				},
			},
			baseBlock
		)
	);

	registerBlockType(
		'test/test-align-array',
		Object.assign(
			{
				apiVersion: 3,
				title: 'Test Align Array',
				supports: {
					align: [ 'left', 'center' ],
				},
			},
			baseBlock
		)
	);

	registerBlockType(
		'test/test-default-align',
		Object.assign(
			{
				apiVersion: 3,
				title: 'Test Default Align',
				attributes: {
					align: {
						type: 'string',
						default: 'right',
					},
				},
				supports: {
					align: true,
				},
			},
			baseBlock
		)
	);
} )();
