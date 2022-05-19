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
