( function () {
	const registerBlockType = wp.blocks.registerBlockType;
	const el = wp.element.createElement;

	const baseBlock = {
		icon: 'cart',
		category: 'text',
		edit() {
			return el(
				'div',
				{ style: { outline: '1px solid gray', padding: 5 } },
				'Test Align Hook'
			);
		},
		save() {
			return el(
				'div',
				{ style: { outline: '1px solid gray', padding: 5 } },
				'Test Align Hook'
			);
		},
	};

	registerBlockType(
		'test/test-no-alignment-set',
		Object.assign(
			{
				title: 'Test No Alignment Set',
			},
			baseBlock
		)
	);

	registerBlockType(
		'test/test-align-true',
		Object.assign(
			{
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
