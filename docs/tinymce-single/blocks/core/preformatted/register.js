( function( wp ) {

	function insertEmpty() {
		return '<pre><br></pre>';
	}

	function fromBaseState( oldState ) {
		var newState = document.createElement( 'PRE' );

		while ( oldState.firstChild ) {
			newState.appendChild( oldState.firstChild );
		}

		oldState.parentNode.replaceChild( newState, oldState );

		return newState;
	}

	function toBaseState( oldState ) {
		var newState = document.createElement( 'P' );

		while ( oldState.firstChild ) {
			newState.appendChild( oldState.firstChild );
		}

		oldState.parentNode.replaceChild( newState, oldState );

		return newState;
	}

	window.wp.blocks.registerBlock( {
		name: 'preformatted',
		namespace: 'wp',
		displayName: 'Preformatted',
		elements: [ 'pre' ],
		type: 'text',
		editable: [ '' ],
		icon: 'gridicons-code',
		placeholders: {
			'': 'Write preformatted text\u2026'
		},
		controls: [
			'text-switcher',
			'|',
			{
				icon: 'gridicons-cog',
				onClick: function() {}
			}
		],
		insert: insertEmpty,
		fromBaseState: fromBaseState,
		toBaseState: toBaseState
	} );

} )( window.wp );
