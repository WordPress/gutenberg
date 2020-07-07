window.setTimeout( () => {
	// Delaying autosaves we avoid creating drafts to remote
	const settings = window.wp.data.select( 'core/editor' ).getEditorSettings();
	settings.autosaveInterval = 60 * 60 * 24 * 7; //Let's wait a week for it to autosave.
	window.wp.data.dispatch( 'core/editor' ).updateEditorSettings( settings );

	const nuxStore = window.wp.data.dispatch( 'automattic/nux' );
	if ( nuxStore ) {
		nuxStore.setWpcomNuxStatus( { isNuxEnabled: false } );
	}
}, 0 );
