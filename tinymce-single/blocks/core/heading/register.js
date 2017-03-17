( function( wp ) {

	function getControls() {
		var controls = [];

		controls.push( 'text-switcher', '|' );

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

		controls.push( '|', 'text-align-left', 'text-align-center', 'text-align-right' );

		return controls;
	}

	function toBaseState( oldState ) {
		var newState = document.createElement( 'P' );

		while ( oldState.firstChild ) {
			newState.appendChild( oldState.firstChild );
		}

		oldState.parentNode.replaceChild( newState, oldState );

		return newState;
	}

	function fromBaseState( oldState ) {
		var newState = document.createElement( 'H1' );

		while ( oldState.firstChild ) {
			newState.appendChild( oldState.firstChild );
		}

		oldState.parentNode.replaceChild( newState, oldState );

		return newState;
	}

	wp.blocks.registerBlock( {
		name: 'heading',
		namespace: 'wp',
		displayName: 'Heading',
		elements: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
		type: 'text',
		editable: [ '' ],
		placeholders: {
			'': 'Write heading\u2026'
		},
		icon: 'gridicons-heading',
		controls: getControls(),
		toBaseState: toBaseState,
		fromBaseState: fromBaseState,
		insert: function() {
			// Maybe detect best heading based on document outline.
			return '<h1><br></h1>';
		}
	} );

} )( window.wp );
