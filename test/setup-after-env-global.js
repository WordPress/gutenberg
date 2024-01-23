// Ignore those deprecation messages due to a 17.5.1-specific hotfx: https://github.com/WordPress/gutenberg/pull/58031
const ignoredMessages = [
	"wp.data.select( 'core/preferences' ).get( 'core/edit-post', 'editorMode' ) is deprecated since version 6.5. Please use wp.data.select( 'core/preferences' ).get( 'core', 'editorMode' ) instead.",
	"wp.data.select( 'core/preferences' ).get( 'core/edit-post', 'hiddenBlockTypes' ) is deprecated since version 6.5. Please use wp.data.select( 'core/preferences' ).get( 'core', 'hiddenBlockTypes' ) instead.",
	// Add other messages to ignore here
];

// Custom logic for console.warn
const customWarn = ( originalWarn ) => {
	return ( message ) => {
		if ( ! ignoredMessages.includes( message ) ) {
			originalWarn( message );
		}
	};
};

// Redefine console.warn with custom logic while preserving the spy structure
beforeAll( () => {
	// eslint-disable-next-line no-console
	const originalWarn = console.warn;
	Object.assign( console, {
		warn: customWarn( originalWarn ),
	} );
} );
