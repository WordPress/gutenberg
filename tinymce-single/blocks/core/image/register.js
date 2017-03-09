window.wp.blocks.registerBlock( {
	name: 'image',
	namespace: 'core',
	displayName: 'Image',
	type: 'media',
	icon: 'gridicons-image',
	controls: [
		'block-align-left',
		'block-align-center',
		'block-align-right',
		'block-align-full',
		'togglefigcaption'
	],
	insert: function() {
		return (
			'<figure data-wp-block-type="core:image" class="alignright" contenteditable="false">' +
				'<img src="https://cldup.com/HN3-c7ER9p.jpg" alt="">' +
				'<figcaption contenteditable="true">I have no idea which mountain this is. It looks tall!</figcaption>' +
			'</figure>'
		);
	}
} );
