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
		'new',
		'formatting',
		'clean-paste',
		'lists',
		'paste',
		'toolbar',
		'wplink',
		'wptextpattern'
	],
	schema: 'html5-strict',
	selector: '.editor',
	theme: false,
	toolbar: false,
	formats: {
		alignleft: [
			{
				selector: 'p,h1,h2,h3,h4,h5,h6',
				styles: { textAlign: 'left' }
			},
			{
				selector: 'figure',
				classes: 'alignleft'
			}
		],
		aligncenter: [
			{
				selector: 'p,h1,h2,h3,h4,h5,h6',
				styles: { textAlign: 'center' }
			},
			{
				selector: 'figure',
				classes: 'aligncenter'
			}
		],
		alignright: [
			{
				selector: 'p,h1,h2,h3,h4,h5,h6',
				styles: { textAlign: 'right' }
			},
			{
				selector: 'figure',
				classes: 'alignright'
			}
		],
		strikethrough: { inline: 'del' }
	},
	blocks: {
		paragraph: {
			match: function( element ) {
				return element.nodeName === 'P';
			},
			buttons: [ 'alignleft', 'aligncenter', 'alignright', 'heading', 'blockquote', 'bullist', 'preformatted', 'removeblock' ],
			icon: 'gridicons-posts'
		},
		heading: {
			match: function( element ) {
				var nodeName = element.nodeName;

				return (
					nodeName === 'H1' ||
					nodeName === 'H2' ||
					nodeName === 'H3' ||
					nodeName === 'H4' ||
					nodeName === 'H5' ||
					nodeName === 'H6'
				);
			},
			buttons: [ 'alignleft', 'aligncenter', 'alignright', 'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6', 'removeheading', 'removeblock' ],
			icon: 'gridicons-heading'
		},
		list: {
			match: function( element ) {
				return element.nodeName === 'UL' || element.nodeName === 'OL';
			},
			buttons: [ 'bullist', 'numlist', 'removelist', 'removeblock' ],
			icon: 'gridicons-list-unordered'
		},
		image: {
			match: function( element ) {
				return element.nodeName === 'FIGURE';
			},
			buttons: [ 'imgalignleft', 'imgaligncenter', 'imgalignright', 'togglefigcaption', 'removeblock' ],
			icon: 'gridicons-image'
		},
		blockquote: {
			match: function( element ) {
				return element.nodeName === 'BLOCKQUOTE';
			},
			buttons: [ 'removeblockquote', 'removeblock' ],
			icon: 'gridicons-quote'
		},
		preformatted: {
			match: function( element ) {
				return element.nodeName === 'PRE';
			},
			buttons: [ 'syntax', 'removepreformatted', 'removeblock' ],
			icon: 'gridicons-code'
		}
	}
} );
