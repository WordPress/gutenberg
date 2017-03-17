( function( wp ) {

	function insertEmpty() {
		return '<blockquote><p><br></p></blockquote>';
	}

	function fromBaseState( oldState ) {
		var newState = document.createElement( 'BLOCKQUOTE' );

		oldState.parentNode.insertBefore( newState, oldState );

		newState.appendChild( oldState );

		return newState;
	}

	function toBaseState( oldState ) {
		var newState = oldState.firstChild;
		var footer = oldState.querySelector( 'footer' );

		if ( footer ) {
			oldState.removeChild( footer );
		}

		while ( oldState.firstChild ) {
			oldState.parentNode.insertBefore( oldState.firstChild, oldState );
		}

		oldState.parentNode.removeChild( oldState );

		return newState;
	}

	function onSelect( block ) {
		var footer = block.querySelector( 'footer' );

		if ( ! footer ) {
			block.insertAdjacentHTML( 'beforeend',
				'<footer><br></footer>' );
		}
	}

	function onDeselect( block ) {
		var footer = block.querySelector( 'footer' );

		if ( footer && ! footer.textContent ) {
			block.removeChild( footer );
		}
	}

	wp.blocks.registerBlock( {
		name: 'quote',
		namespace: 'wp',
		displayName: 'Quote',
		elements: [ 'blockquote' ],
		type: 'text',
		icon: 'gridicons-quote',
		editable: [ '', 'footer' ],
		placeholders: {
			'': 'Write quote\u2026',
			footer: 'Write citation\u2026'
		},
		controls: [
			'text-switcher'
		],
		insert: insertEmpty,
		fromBaseState: fromBaseState,
		toBaseState: toBaseState,
		onSelect: onSelect,
		onDeselect: onDeselect
	} );

} )( window.wp );
