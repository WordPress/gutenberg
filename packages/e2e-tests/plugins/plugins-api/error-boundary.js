( function () {
	const registerPlugin = wp.plugins.registerPlugin;

	function MyErrorPlugin() {
		// throw new Error('Whoops!')
		throw new TypeError('Hello', "someFile.js", 10)
	}

	registerPlugin( 'my-error-plugin', {
		render: MyErrorPlugin,
	} );
} )();
