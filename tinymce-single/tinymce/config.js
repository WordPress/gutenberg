window.tinymce.init( {
	browser_spellcheck: true,
	inline: true,
	// Enter creates a fresh paragraph.
	keep_styles: false,
	menubar: false,
	object_resizing: false,
	plugins: [
		'block',
		'wp:blocks:parse',
		'clean-paste',
		'lists',
		'paste',
		'table',
		'toolbar',
		'wplink',
		'wptextpattern'
	],
	schema: 'html5-strict',
	selector: '#editor',
	theme: false,
	toolbar: false,
	formats: {
		strikethrough: { inline: 'del' }
	},
	setup: function( editor ) {
		editor.on( 'loadContent', function() {
			editor.setContent( window.content );
		} );
	}
} );
