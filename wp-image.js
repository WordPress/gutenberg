/**
 * wp-image.js is the standard block for image handling.
 */

( function() {
	var create

	// In Browser.
	if ( typeof window !== 'undefined' ) {
		create = window.gutenberg()
	}

	// In Node.js
	if ( typeof module !== 'undefined' && typeof module.exports !== 'undefined' ) {
		create = require( './block-api.js' )()
	}

	/**
	 * Control renderer.
	 */
	var renderBlockImageControl = function( control ) {
		if ( typeof document !== 'undefined' ) {
			var button = document.createElement( 'button' );
			button.className = 'block-text is-active';

			var icon = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
			icon.setAttribute( 'xmlns', 'http://www.w3.org/2000/svg' );
			icon.setAttribute( 'viewBox', '0 0 24 24' );

			var title = document.createElement( 'title' );
			var titleText = document.createTextNode( control.name );
			title.appendChild( titleText );

			var rect = document.createElementNS( 'http://www.w3.org/2000/svg', 'rect' )
			rect.setAttribute( 'x', '0' );
			rect.setAttribute( 'fill', 'none' );
			rect.setAttribute( 'width', '24' );
			rect.setAttribute( 'heigh', '24' );

			var group = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );

			var path = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );
			path.setAttribute( 'd', control.icon.path );

			group.appendChild( path );

			icon.appendChild( title );
			icon.appendChild( rect );
			icon.appendChild( group );

			button.appendChild( icon );

			return button;
		}
	}

	/**
	 * Control actions.
	 */
	var setImageState = function( classes, event ) {
		event.stopPropagation();
		selectedBlock.className = 'is-selected ' + classes;
	}

	var setImageFullWidth = setImageState.bind( null, 'align-full-width' );
	var setImageAlignNone = setImageState.bind( null, '' );
	var setImageAlignLeft = setImageState.bind( null, 'align-left' );
	var setImageAlignRight = setImageState.bind( null, 'align-right' );

	var imageBlock = create.block( {
		name: 'Image',
		type: 'wp-image',
		controls: [
			create.control(
				{
					name: 'No Alignment',
					type: 'no-align',
					displayArea: 'block',
					render: renderBlockImageControl,
					icon: {
						path: 'M3 5h18v2H3V5zm0 14h18v-2H3v2zm5-4h8V9H8v6z'
					},
					handlers: [
						{
							'type': 'click',
							'action': setImageAlignNone
						}
					]
				}
			),
			create.control(
				{
					name: 'Align Left',
					type: 'left-align',
					displayArea: 'block',
					render: renderBlockImageControl,
					icon: {
						path: 'M3 5h18v2H3V5zm0 14h18v-2H3v2zm0-4h8V9H3v6zm10 0h8v-2h-8v2zm0-4h8V9h-8v2z'
					},
					handlers: [
						{
							'type': 'click',
							'action': setImageAlignLeft
						}
					]
				}
			),
			create.control(
				{
					name: 'Align Right',
					type: 'right-align',
					displayArea: 'block',
					render: renderBlockImageControl,
					icon: {
						path: 'M21 7H3V5h18v2zm0 10H3v2h18v-2zm0-8h-8v6h8V9zm-10 4H3v2h8v-2zm0-4H3v2h8V9z'
					},
					handlers: [
						{
							'type': 'click',
							'action': setImageAlignRight
						}
					]
				}
			),
			create.control(
				{
					name: 'Make Full Width',
					type: 'full-wdith',
					displayArea: 'block',
					render: renderBlockImageControl,
					icon: {
						path: 'M21 3v6h-2V6.41l-3.29 3.3-1.42-1.42L17.59 5H15V3zM3 3v6h2V6.41l3.29 3.3 1.42-1.42L6.41 5H9V3zm18 18v-6h-2v2.59l-3.29-3.29-1.41 1.41L17.59 19H15v2zM9 21v-2H6.41l3.29-3.29-1.41-1.42L5 17.59V15H3v6z'
					},
					handlers: [
						{
							'type': 'click',
							'action': setImageFullWidth
						}
					]
				}
			)
		]
	} )

	if ( typeof window !== 'undefined' ) {
		window.imageBlock = imageBlock
	}

	if ( typeof module !== 'undefined' ) {
		module.exports = imageBlock
	}
} () )
