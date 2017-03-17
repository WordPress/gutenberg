( function( wp ) {

	function insertEmpty() {
		return '<section><p><br></p></section>';
	}

	function fromBaseState( oldState ) {
		var newState = document.createElement( 'SECTION' );

		newState.setAttribute( 'data-wp-block-type', 'my-awesome-plugin:custom-blue-box' );

		oldState.parentNode.insertBefore( newState, oldState );

		newState.appendChild( oldState );

		return newState;
	}

	function toBaseState( oldState ) {
		var newState = oldState.firstChild;

		while ( oldState.firstChild ) {
			oldState.parentNode.insertBefore( oldState.firstChild, oldState );
		}

		oldState.parentNode.removeChild( oldState );

		return newState;
	}

	wp.blocks.registerBlock( {
		name: 'custom-blue-box',
		namespace: 'my-awesome-plugin',
		displayName: 'Custom Box',
		icon: 'gridicons-custom-post-type',
		type: 'text',
		editable: [ '' ],
		placeholders: {
			'p:first': 'Write in the magic box! ✨'
		},
		insert: insertEmpty,
		fromBaseState: fromBaseState,
		toBaseState: toBaseState,
		controls: [
			'text-switcher',
			'|',
			'text-align-left',
			'text-align-center',
			'text-align-right'
		]
	} );

} )( window.wp );
