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

	function onSelect( block ) {
		var figcaption = block.querySelector( 'figcaption' );

		if ( ! figcaption ) {
			block.insertAdjacentHTML( 'beforeend',
				'<figcaption><br></figcaption>' );
		}
	}

	function onDeselect( block ) {
		var figcaption = block.querySelector( 'figcaption' );

		if ( figcaption && ! figcaption.textContent ) {
			block.removeChild( figcaption );
		}
	}

	wp.blocks.registerBlock( {
		name: 'table',
		namespace: 'wp',
		displayName: 'Table',
		type: 'data visualisation',
		icon: 'gridicons-grid',
		editable: [ 'table', 'figcaption' ],
		placeholders: {
			figcaption: 'Write caption\u2026'
		},
		insert: insertEmpty,
		onSelect: onSelect,
		onDeselect: onDeselect,
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
				icon: 'gridicons-cog',
				onClick: function() {}
			}
		]
	} );

} )( window.wp );
