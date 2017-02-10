/**
 * wp-text.js is the standard block for text handling.
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
	 * Control render functions.
	 */
	var renderBlockTextControl = function( control ) {
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
	var setTextState = function( classes, event ) {
		event.stopPropagation();
		selectedBlock.className = 'is-selected ' + classes;
	}

	var setTextAlignLeft = setTextState.bind( null, 'align-left' );
	var setTextAlignCenter = setTextState.bind( null, 'align-center' );
	var setTextAlignRight = setTextState.bind( null, 'align-right' );

	 /**
	 * Block.
	 */
	var textBlock = create.block( {
		name: 'Text',
		type: 'wp-text',
		controls: [
			create.control(
				{
					name: 'Align Left',
					type: 'left-align',
					displayArea: 'block',
					render: renderBlockTextControl,
					icon: {
						path: 'M4 19h16v-2H4v2zm10-6H4v2h10v-2zM4 9v2h16V9H4zm10-4H4v2h10V5z'
					},
					handlers: [
						{
							'type': 'click',
							'action': setTextAlignLeft
						}
					]
				}
			),
			create.control(
				{
					name: 'Align Center',
					type: 'center-align',
					displayArea: 'block',
					render: renderBlockTextControl,
					icon: {
						path: 'M4 19h16v-2H4v2zm13-6H7v2h10v-2zM4 9v2h16V9H4zm13-4H7v2h10V5z'
					},
					handlers: [
						{
							'type': 'click',
							'action': setTextAlignCenter
						}
					]
				}
			),
			create.control(
				{
					name: 'Align Right',
					type: 'right-align',
					displayArea: 'block',
					render: renderBlockTextControl,
					icon: {
						path: 'M20 17H4v2h16v-2zm-10-2h10v-2H10v2zM4 9v2h16V9H4zm6-2h10V5H10v2z'
					},
					handlers: [
						{
							'type': 'click',
							'action': setTextAlignRight
						}
					]
				}
			)
		]
	} )

	if ( typeof window !== 'undefined' ) {
		window.textBlock = textBlock
	}

	if ( typeof module !== 'undefined' ) {
		module.exports = textBlock
	}
} () );
