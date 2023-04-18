( function () {
	const { registerBlockType } = wp.blocks;
	const { addFilter } = wp.hooks;

	registerBlockType( 'e2e-tests/hello-world', {
		title: 'Hello World',
		description: 'Hello World test block.',
		category: 'widgets',
		edit() {
			return 'Hello Editor!';
		},
		save() {
			return 'Hello Frontend!';
		},
	} );

	registerBlockType( 'e2e-tests/auto-inserted', {
		title: 'Auto Inserted',
		description: 'Auto-inserted test block.',
		category: 'widgets',
		edit() {
			return 'I got auto-inserted!';
		},
		save() {
			return 'I got auto-inserted';
		},
		autoInsert: {
			after: [ 'core/quote' ],
		},
	} );

	addFilter(
		'blocks.registerBlockType',
		'e2e-tests/hello-world/filter-added-after-registration',
		( blockType, name ) => {
			if ( name === 'e2e-tests/hello-world' ) {
				return {
					...blockType,
					title: 'Filtered Hello World',
				};
			}

			return blockType;
		}
	);
} )();
