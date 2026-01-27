( function() {
	const { registerBlockType } = wp.blocks;

	registerBlockType( 'test/crash-block', {
		edit: function Edit() {
			// This block always crashes
			throw new Error( 'Crash block error for testing recovery' );
		},
		save: function Save() {
			return null;
		}
	} );

	console.log( '[Crash Block] Registered!' );
} )();
