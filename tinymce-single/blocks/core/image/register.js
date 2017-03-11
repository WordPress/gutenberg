( function( wp ) {

	function insertEmpty() {
		return (
			'<figure>' +
				'<div class="wp-blocks-placeholder">' +
					'<svg width="48" height="48">' +
						'<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="../shared/gridicons.svg#gridicons-add-outline"></use>' +
					'</svg>' +
					'<p>Pick image</p>' +
				'</div>' +
			'</figure>'
		);
	}

	function pickTarget( parents, child ) {
		for ( var i = 0; i < parents.length; i++ ) {
			if ( parents[ i ] === child || parents[ i ].contains( child ) ) {
				return parents[ i ]
			}
		}
	}

	function onClick( event, block, adjustUI ) {
		var target = pickTarget( block.querySelectorAll( 'div' ), event.target );

		if ( ! target ) {
			return;
		}

		if ( ( ' ' + target.className + ' ' ).indexOf( ' wp-blocks-placeholder ' ) === -1 ) {
			return;
		}

		wp.filePicker( false, 'image/*' )
			.then( function( files ) {
				if ( ! files || ! files.length ) {
					return;
				}

				if ( files[0].type.indexOf( 'image/' ) !== 0 ) {
					return;
				}

				var img = document.createElement( 'img' );

				img.src = URL.createObjectURL( files[0] );
				img.onload = adjustUI;

				target.parentNode.replaceChild( img, target );
			} )
			.catch( function() {} );
	}

	wp.blocks.registerBlock( {
		name: 'image',
		namespace: 'core',
		displayName: 'Image',
		type: 'media',
		icon: 'gridicons-image',
		editable: [ 'figcaption' ],
		controls: [
			'block-align-left',
			'block-align-center',
			'block-align-right',
			'block-align-full',
			{
				icon: 'gridicons-caption',
				onClick: function( block ) {
					var figcaption = block.querySelector( 'figcaption' );

					if ( figcaption ) {
						block.removeChild( figcaption );
					} else {
						block.insertAdjacentHTML( 'beforeend',
							'<figcaption><br></figcaption>' );
					}

					window.wp.blocks.selectBlock( block );
				},
				isActive: function( block ) {
					return !! block.querySelector( 'figcaption' );
				}
			}
		],
		insert: insertEmpty,
		onClick: onClick
	} );

} )( window.wp );
