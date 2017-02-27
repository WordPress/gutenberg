// For testing, learning and debugging. Feel free to add.
// See https://www.tinymce.com/docs/advanced/events/
window.tinymce.PluginManager.add( 'logger', function( editor ) {
	var types = {
		selectionChange: 'fires when the selection changes.',
		nodeChange: 'fires when the selection and the node changes. Use `event.element`.',
		beforePastePreProcess: 'gives raw paste content before processing.',
		pastePostProcess: 'gives paste content after processing. Use `event.node.innerHTML`.',
		beforeSetContent: 'fires before content is set in the editor. Can be used for manipulation.',
		setContent: 'fires after content is set in the editor.',
		beforeExecCommand: 'fires before commands are executed.',
		execCommand: 'fires after commands are executed.',
		change: 'fires when a new undo level is added.',
		dirty: 'fires when the editor is considered to be in a dirty (unsaved) state.'
	};

	window.tinymce.each( types, function( info, type ) {
		editor.on( type, function( event ) {
			window.console.log( type, info, event );
		} );
	} );
} );
