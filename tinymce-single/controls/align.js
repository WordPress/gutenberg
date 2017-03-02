( function( wp, $ ) {
	var RX_ALIGN_CLASSNAME = /^(text-align-|align)([\w-]+)/;

	function createOnClick( classNamePrefix, position ) {
		return function( node ) {
			return $( node )
				.removeClass( function( i, className ) {
					return RX_ALIGN_CLASSNAME.test( className ) ? className : '';
				} )
				.addClass( classNamePrefix + position );
		};
	}

	function createIsActive( classNamePrefix, position ) {
		return function( node ) {
			var classNames = node.className.split( ' ' ),
				i, className, match;

			for ( i = 0; i < classNames.length; i++ ) {
				className = classNames[ i ];
				match = className.match( RX_ALIGN_CLASSNAME );

				if ( match && classNamePrefix === match[ 1 ] ) {
					return position === match[ 2 ];
				}
			}

			return 'left' === position;
		};
	}

	[ 'left', 'center', 'right' ].forEach( function( position ) {
		wp.blocks.registerControl( 'text-align-' + position, {
			icon: 'gridicons-align-' + position,
			onClick: createOnClick( 'text-align-', position ),
			isActive: createIsActive( 'text-align-', position )
		} );

		wp.blocks.registerControl( 'block-align-' + position, {
			icon: 'gridicons-align-image-' + position,
			onClick: createOnClick( 'align', position ),
			isActive: createIsActive( 'align', position )
		} );
	} );
} )( window.wp = window.wp || {}, window.jQuery );
