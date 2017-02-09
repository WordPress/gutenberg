/**
 * textType.js is a type used for creating text blocks.
 */
( function() {
	// import blockType
	if ( typeof module !== 'undefined' && typeof module.exports !== 'undefined' && typeof require === 'function' ) {
		blockType = require( '../api/blockType' )
	}

	// import controlType
	if ( typeof module !== 'undefined' && typeof module.exports !== 'undefined' && typeof require === 'function' ) {
		controlType = require( '../api/controlType' )
	}

	// import block
	if ( typeof module !== 'undefined' && typeof module.exports !== 'undefined' && typeof require === 'function' ) {
		block = require( '../api/block' )
	}

	// import control
	if ( typeof module !== 'undefined' && typeof module.exports !== 'undefined' && typeof require === 'function' ) {
		control = require( '../api/control' )
	}

	/**
	 * Control render functions.
	 */
	var renderBlockTextControl = function( control ) {
		return function() {
			if ( typeof document !== 'undefined' ) {
				var button = document.createElement( 'button' );
				button.className = 'block-text';

				var icon = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
				icon.setAttribute( 'xmlns', 'http://www.w3.org/2000/svg' );
				icon.setAttribute( 'viewBox', '0 0 24 24' );

				var title = document.createElement( 'title' );
				var titleText = document.createTextNode( control.title );
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
	}

	var createBlockControl = function( controlType ) {
		if ( typeof controlType === 'undefined' ) {
			controlType = this
		}

		return control( {
			render: renderBlockTextControl( controlType )
		} )
	}

	/**
	 * Control actions.
	 */
	var controlSiblingIsActive = function( control ) {
		var currentControl = control
		console.log( 'INITIAL' )
		console.log( currentControl )

		// Check next siblings.
		while( currentControl ) {
			currentControl = currentControl.nextSibling
			console.log( 'NEXT' )
			console.log( currentControl )
			if ( currentControl && currentControl.classList.contains( 'is-active' ) ) {
				return currentControl
			}
		}

		// Reset current control.
		currentControl = control
		console.log( 'RESET' )
		console.log( currentControl )

		// Check previous siblings.
		while( currentControl ) {
			currentControl = currentControl.previousSibling
			console.log( 'PREVIOUS' )
			console.log( currentControl )
			if ( currentControl && currentControl.classList.contains( 'is-active' ) ) {
				return currentControl
			}
		}
	}

	var setElementState = function( className ) {
		return function( element ) {
			return function( event ) {
				event.stopPropagation()
				var control = event.currentTarget

				var activeControlSibling = controlSiblingIsActive( control )
				if ( activeControlSibling ) {
					activeControlSibling.classList.remove( 'is-active' )
				}

				control.classList.add( 'is-active' )

				element.className = 'is-selected';
				if ( className ) {
					element.classList.add( className )
				}
			}
		}
	}

	var setTextAlignLeft = setElementState( 'align-left' )
	var setTextAlignCenter = setElementState( 'align-center' )
	var setTextAlignRight = setElementState( 'align-right' )

	var textTypeProperties = {
		type: 'wp-text',
		title: 'Paragraph',
		controls: [
			controlType( {
				type: 'left-align',
				title: 'Align Left',
				displayArea: 'block',
				create: createBlockControl,
				handlers: [
					{
						type: 'click',
						action: setTextAlignLeft
					}
				],
				icon: {
						path: 'M4 19h16v-2H4v2zm10-6H4v2h10v-2zM4 9v2h16V9H4zm10-4H4v2h10V5z'
				}
			} ),
			controlType( {
				type: 'center-align',
				title: 'Center Align',
				displayArea: 'block',
				create: createBlockControl,
				handlers: [
					{
						type: 'click',
						action: setTextAlignCenter
					}
				],
				icon: {
					path: 'M4 19h16v-2H4v2zm13-6H7v2h10v-2zM4 9v2h16V9H4zm13-4H7v2h10V5z'
				},
			} ),
			controlType( {
				type: 'right-align',
				title: 'Align Right',
				displayArea: 'block',
				create: createBlockControl,
				handlers: [
					{
						type: 'click',
						action: setTextAlignRight
					}
				],
				icon: {
					path: 'M20 17H4v2h16v-2zm-10-2h10v-2H10v2zM4 9v2h16V9H4zm6-2h10V5H10v2z'
				},
			} ),
			controlType( {
				type: 'bold',
				title: 'Make Bold',
				displayArea: 'inline'
			} ),
			controlType( {
				type: 'italics',
				title: 'Italicize',
				displayArea: 'inline'
			} ),
			controlType( {
				type: 'strikethrough',
				title: 'Strikethrough',
				displayArea: 'inline'
			} ),
			controlType( {
				type: 'underline',
				title: 'Underline',
				displayArea: 'inline'
			} )
		]
	}

	var textType = blockType( textTypeProperties )

	if ( typeof window !== 'undefined' ) {
		window.textType = textType
	}

	if ( typeof module !== 'undefined' && typeof module.exports !== 'undefined' ) {
		module.exports = textType
	}
} () )
