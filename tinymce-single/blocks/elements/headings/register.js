( function( register ) {
	function getButtons() {
		var buttons = [
			'alignleft',
			'aligncenter',
			'alignright'
		];

		'123456'.split( '' ).forEach( function( level ) {
			buttons.push( {
				text: level,
				stateSelector: 'h' + level,
				onClick: function( editor, element ) {
					editor.formatter.apply( 'h' + level, element );
				}
			} );
		} );

		buttons.push( {
			icon: 'gridicons-posts',
			onClick: function( editor, element ) {
				editor.formatter.apply( 'p', element );
			}
		} );

		return buttons;
	}

	register( {
		elements: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
		type: 'text',
		icon: 'gridicons-heading',
		buttons: getButtons()
	} );
} )( window.wp.blocks.register );
