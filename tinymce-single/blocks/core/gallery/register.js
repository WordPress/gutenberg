window.wp.blocks.registerBlock( {
	name: 'gallery',
	namespace: 'core',
	type: 'image',
	keywords: [],
	icon: 'gridicons-image-multiple',
	controls: [
		'block-align-left',
		'block-align-center',
		'block-align-right',
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
	]
} );
