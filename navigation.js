( function( window, document ) {
	var PROTOTYPES, linkCounter, navigation, path, link, style;

	/**
	 * Set of all prototypes, keyed by path with label value.
	 *
	 * @type {Object}
	 */
	PROTOTYPES = {
		'/': 'UI Prototype',
		'/tinymce-per-block/': 'TinyMCE per block prototype'
	};

	// Generate Navigation DOM

	navigation = document.createElement( 'div' );
	navigation.className = 'prototype-navigation';

	linkCounter = 0;

	for ( path in PROTOTYPES ) {
		if ( ! PROTOTYPES.hasOwnProperty( path ) ) {
			return;
		}

		link = document.createElement( 'a' );
		link.href = '/gutenberg' + path;
		link.setAttribute( 'title', PROTOTYPES[ path ] );
		link.textContent = ++linkCounter;

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
