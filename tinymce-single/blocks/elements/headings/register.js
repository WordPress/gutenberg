( function( register ) {
	function getButtons() {
		var buttons = [];

		'123456'.split( '' ).forEach( function( level ) {
			buttons.push( {
				icon: 'gridicons-heading',
				text: level,
				stateSelector: 'h' + level,
				onClick: function( editor, element ) {
					editor.formatter.apply( 'h' + level, element );
				}
			} );
		} );

		buttons.push( {
			classes: 'remove-formatting',
			icon: 'gridicons-heading',
			onClick: function( editor, element ) {
				editor.formatter.apply( 'p', element );
			}
		} );

		buttons.push( 'text-align-center' );

		return buttons;
	}

	register( {
		elements: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
		type: 'text',
		icon: 'gridicons-heading',
		buttons: getButtons()
	} );
} )( window.wp.blocks.register );
