( function( wp ) {
	function getControls() {
		var controls = [];

		'123456'.split( '' ).forEach( function( level ) {
			controls.push( {
				icon: 'gridicons-heading',
				text: level,
				stateSelector: 'h' + level,
				onClick: function( block, editor ) {
					editor.formatter.apply( 'h' + level, block );
				}
			} );
		} );

		controls.push( {
			classes: 'remove-formatting',
			icon: 'gridicons-heading',
			onClick: function( block, editor ) {
				editor.formatter.apply( 'p', block );
			}
		} );

		controls.push( 'text-align-left', 'text-align-center', 'text-align-right' );

		return controls;
	}

	wp.blocks.registerBlock( {
		name: 'heading',
		displayName: 'Heading',
		elements: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
		type: 'text',
		icon: 'gridicons-heading',
		controls: getControls(),
		insert: function() {

		}
	} );
} )( window.wp );
