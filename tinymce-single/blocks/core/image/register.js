window.wp.blocks.registerBlock( {
	name: 'image',
	namespace: 'core',
	displayName: 'Image',
	type: 'media',
	icon: 'gridicons-image',
	controls: [
		'block-align-left',
		'block-align-center',
		'block-align-right',
		'block-align-full',
		'togglefigcaption'
	],
	insert: function( block, editor ) {

	}
} );
