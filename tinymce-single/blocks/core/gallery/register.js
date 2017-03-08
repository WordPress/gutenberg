window.wp.blocks.registerBlock( {
	name: 'gallery',
	namespace: 'core',
	displayName: 'Gallery',
	type: 'image',
	keywords: [],
	icon: 'gridicons-image-multiple',
	controls: [
		'block-align-left',
		'block-align-center',
		'block-align-right',
		'block-align-full',
		// {
		// 	type: 'select',
		// 	label: 'Columns'
		// },
		// {
		// 	type: 'button',
		// 	label: 'Columns',
		// 	icon: 'gridicons-image',
		// 	command: function( editor, node ) {
		// 		// body...
		// 	}
		// },
		{
			icon: 'gridicons-cog'
		}
	],
	insert: function( block, editor ) {

	}
} );
