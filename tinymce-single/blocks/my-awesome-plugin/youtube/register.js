window.wp.blocks.registerBlock( {
	name: 'youtube',
	namespace: 'my-awesome-plugin',
	displayName: 'YouTube Video',
	type: 'video',
	keywords: [],
	icon: 'gridicons-video',
	controls: [
		'block-align-left',
		'block-align-center',
		'block-align-right',
		'block-align-full',
		{
			icon: 'gridicons-cog'
		}
	],
	insert: function( block, editor ) {

	}
} );
