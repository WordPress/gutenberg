( function( wp ) {

	function insertEmpty() {
		return '<pre><br></pre>';
	}

	function fromBaseState( block, editor ) {
		editor.formatter.apply( 'pre', block );
	}

	function toBaseState( block, editor ) {
		editor.formatter.remove( 'pre', block );
	}

	window.wp.blocks.registerBlock( {
		name: 'preformatted',
		nameSpace: 'core',
		displayName: 'Preformatted',
		elements: [ 'pre' ],
		type: 'text',
		icon: 'gridicons-code',
		placeholders: {
			'': 'Write preformatted text\u2026'
		},
		controls: [
			{
				icon: 'gridicons-cog',
				onClick: function() {}
			},
			{
				classes: 'remove-formatting',
				icon: 'gridicons-code',
				onClick: function( block, editor ) {
					editor.formatter.remove( 'pre', block );
				}
			}
		],
		insert: insertEmpty,
		fromBaseState: fromBaseState,
		toBaseState: toBaseState
	} );

} )( window.wp );
