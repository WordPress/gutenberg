window.tinymce.init( {
	browser_spellcheck: true,
	// Enter twice in a nested block creates a fresh paragraph.
	end_container_on_empty_block: true,
	inline: true,
	// Enter creates a fresh paragraph.
	keep_styles: false,
	menubar: false,
	object_resizing: false,
	plugins: [
		'block',
		'clean-paste',
		'lists',
		'paste',
		'toolbar',
		'wplink',
		'wptextpattern'
	],
	schema: 'html5-strict',
	selector: '#editor',
	theme: false,
	toolbar: false,
	formats: {
		alignleft: [ {
			selector: 'p,h1,h2,h3,h4,h5,h6',
			styles: { textAlign: 'left' }
		} ],
		aligncenter: [ {
			selector: 'p,h1,h2,h3,h4,h5,h6',
			styles: { textAlign: 'center' }
		} ],
		alignright: [ {
			selector: 'p,h1,h2,h3,h4,h5,h6',
			styles: { textAlign: 'right' }
		} ],
		strikethrough: { inline: 'del' }
	}
} );
