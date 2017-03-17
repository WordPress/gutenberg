( function( wp ) {
	function createOnClick( classNamePrefix, position ) {
		return function( node ) {
			node.className = node.className.replace( new RegExp( classNamePrefix + '[^ ]+ ?', 'g' ), '' ).trim();
			node.className += ( node.className ? ' ' : '' ) + classNamePrefix + position;
		};
	}

	function createIsActive( classNamePrefix, position, normal ) {
		return function( node ) {
			var matches = node.className.match( new RegExp( classNamePrefix + '([^ ]+)' ) );

			if ( matches ) {
				return position === matches[ 1 ];
			} else {
				return position === normal;
			}
		};
	}

	[ 'left', 'center', 'right', 'full' ].forEach( function( position ) {
		wp.blocks.registerControl( 'text-align-' + position, {
			icon: 'gridicons-align-' + position,
			onClick: createOnClick( 'text-align-', position ),
			isActive: createIsActive( 'text-align-', position, 'left' )
		} );

		wp.blocks.registerControl( 'block-align-' + position, {
			icon: 'gridicons-align-image-' + position,
			onClick: createOnClick( 'align', position ),
			isActive: createIsActive( 'align', position, 'center' )
		} );
	} );
} )( window.wp );
