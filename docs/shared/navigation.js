( function( window, document ) {
	var PROTOTYPES, paths, p, pl, path, navigation, path, label, link, style;

	/**
	 * Set of all prototypes, keyed by path with label value.
	 *
	 * @type {Object}
	 */
	PROTOTYPES = {
		'/': 'UI Prototype',
		'/tinymce-per-block/': 'TinyMCE per block prototype',
		'/tinymce-single/': 'Single TinyMCE instance prototype'
	};

	// Generate Navigation DOM

	navigation = document.createElement( 'div' );
	navigation.className = 'prototype-navigation';

	paths = Object.keys( PROTOTYPES );

	for ( p = 0, pl = paths.length; p < pl; p++ ) {
		path = paths[ p ];
		label = PROTOTYPES[ path ];

		link = document.createElement( 'a' );
		link.href = '/gutenberg' + path;
		link.setAttribute( 'title', label );
		link.textContent = ( p + 1 );

		if ( '/gutenberg' + path === window.location.pathname ) {
			link.className = 'is-current';
		}

		navigation.appendChild( link );
	}

	// Generate Stylesheet DOM

	style = document.createElement( 'style' );
	style.innerHTML = [
		'.prototype-navigation {',
			'font: 13px/1.8 -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif;',
			'display: flex;',
			'position: absolute;',
			'top: 24px;',
			'left: 24px;',
		'}',
		'.prototype-navigation a {',
			'display: inline-block;',
			'width: 28px;',
			'height: 28px;',
			'font-size: 12px;',
			'border: 1px solid #b4b9be;',
			'line-height: 28px;',
			'border-radius: 50%;',
			'text-decoration: none;',
			'text-align: center;',
			'margin-right: 8px;',
		'}',
		'.prototype-navigation a.is-current {',
			'background: #008ec2;',
			'border-color: #008ec2;',
			'color: #fff;',
		'}'
	].join( '\n' );

	// Append to body

	document.body.appendChild( navigation );
	document.body.appendChild( style );

} )( this, this.document );
