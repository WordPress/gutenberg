window.wp.blocks.registerBlock( {
	name: 'hortizontal-rule',
	nameSpace: 'core',
	displayName: 'Horizontal Rule',
	elements: [ 'hr' ],
	type: 'separator',
	icon: 'gridicons-minus',
	insert: function() {
		return '<hr>';
	}
} );
