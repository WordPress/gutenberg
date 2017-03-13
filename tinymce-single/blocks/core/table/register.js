( function( wp ) {

	function insertEmpty() {
		return (
			'<figure>' +
				'<table>' +
					'<tr>' +
						'<td><br></td>' +
						'<td><br></td>' +
					'</tr>' +
					'<tr>' +
						'<td><br></td>' +
						'<td><br></td>' +
					'</tr>' +
				'</table>' +
			'</figure>'
		);
	}

	wp.blocks.registerBlock( {
		name: 'table',
		nameSpace: 'core',
		displayName: 'Table',
		type: 'data visualisation',
		icon: 'gridicons-grid',
		editable: [ 'table', 'figcaption' ],
		insert: insertEmpty,
		controls: [
			'block-align-left',
			'block-align-center',
			'block-align-right',
			'block-align-full',
			{
				classes: 'gridicons-rotate',
				icon: 'gridicons-indent-right',
				onClick: function( block, editor ) {
					editor.execCommand( 'mceTableInsertRowBefore' );
				}
			},
			{
				classes: 'gridicons-rotate',
				icon: 'gridicons-indent-left',
				onClick: function( block, editor ) {
					editor.execCommand( 'mceTableInsertRowAfter' );
				}
			},
			{
				icon: 'gridicons-indent-right',
				onClick: function( block, editor ) {
					editor.execCommand( 'mceTableInsertColBefore' );
				}
			},
			{
				icon: 'gridicons-indent-left',
				onClick: function( block, editor ) {
					editor.execCommand( 'mceTableInsertColAfter' );
				}
			},
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
			},
			{
				icon: 'gridicons-cog',
				onClick: function() {}
			}
		]
	} );

} )( window.wp );
