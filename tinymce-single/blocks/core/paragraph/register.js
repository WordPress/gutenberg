window.wp.blocks.registerBlock( {
	name: 'paragraph',
	nameSpace: 'core',
	displayName: 'Paragraph',
	elements: [ 'p' ],
	type: 'text',
	editable: [ '' ],
	section: 'text',
	icon: 'gridicons-paragraph',
	controls: [
		'text-switcher',
		'|',
		'text-align-left',
		'text-align-center',
		'text-align-right'
	],
	toBaseState: function( state ) {
		return state;
	},
	fromBaseState: function( state ) {
		return state;
	},
	insert: function() {
		return '<p><br></p>';
	}
} );
