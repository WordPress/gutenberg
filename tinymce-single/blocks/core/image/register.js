window.wp.blocks.registerBlock( {
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
	insert: function() {
		return (
			'<figure data-wp-block-type="core:image">' +
				'<img src="https://cldup.com/HN3-c7ER9p.jpg" alt="">' +
				'<figcaption>I have no idea which mountain this is. It looks tall!</figcaption>' +
			'</figure>'
		);
	}
} );
