( function( wp ) {

	function insertEmpty() {
		return '<blockquote><p><br></p></blockquote>';
	}

	function fromBaseState( block, editor ) {
		editor.formatter.apply( 'blockquote', block );
	}

	function toBaseState( block ) {
		var footer = block.querySelector( 'footer' );
		var firstChild = block.firstChild;

		if ( footer ) {
			block.removeChild( footer );
		}

		while ( block.firstChild ) {
			block.parentNode.insertBefore( block.firstChild, block );
		}

		block.parentNode.removeChild( block );

		window.wp.blocks.selectBlock( firstChild );
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

		if ( ! footer.textContent ) {
			block.removeChild( footer );
		}
	}

	wp.blocks.registerBlock( {
		name: 'blockquote',
		nameSpace: 'core',
		displayName: 'Quote',
		elements: [ 'blockquote' ],
		type: 'text',
		icon: 'gridicons-quote',
		restrictToInline: [ 'footer' ],
		controls: [
			{
				classes: 'remove-formatting',
				icon: 'gridicons-quote',
				onClick: toBaseState
			}
		],
		insert: insertEmpty,
		fromBaseState: fromBaseState,
		toBaseState: toBaseState,
		onSelect: onSelect,
		onDeselect: onDeselect
	} );

} )( window.wp );
