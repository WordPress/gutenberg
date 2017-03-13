window.wp.blocks.registerBlock( {
	name: 'paragraph',
	displayName: 'Paragraph',
	elements: [ 'p' ],
	type: 'text',
	section: 'text',
	icon: 'gridicons-posts',
	controls: [
		'text-switcher',
		'|',
		'text-align-left',
		'text-align-center',
		'text-align-right'
	],
	toBaseState: function() {},
	fromBaseState: function() {},
	insert: function() {
		return '<p><br></p>';
	}
} );
