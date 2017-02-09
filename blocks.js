"use strict";

/**
 * Derived functions
 */
var getNextSibling = siblingGetter( 'next' );
var getPreviousSibling = siblingGetter( 'previous' );

/**
 * Globals
 */
var editor = document.getElementsByClassName( 'editor' )[0];
var switcher = document.getElementsByClassName( 'block-switcher' )[0];
var blockControls = document.getElementsByClassName( 'block-controls' )[0];
var inlineControls = document.getElementsByClassName( 'inline-controls' )[0];
var insertBlockButton = document.getElementsByClassName( 'insert-block__button' )[0];
var selectedBlock = null;

/**
 * Initialization
 */
window.addEventListener( 'click', clearBlocks, false );
editor.addEventListener( 'input', attachBlockHandlers, false );
editor.addEventListener( 'input', clearBlocks, false );
insertBlockButton.addEventListener( 'click', openBlockMenu, false );
window.addEventListener( 'mouseup', onSelectText, false );

attachBlockHandlers();
attachControlActions();

/**
 * Core logic
 */
function attachBlockHandlers() {
	var blocks = getBlocks();
	Array.from( blocks ).forEach( function( block ) {
		block.removeEventListener( 'click', selectBlock, false );
		block.addEventListener( 'click', selectBlock, false );
	} );
}

function getBlocks() {
	return Array.prototype.concat.apply( [],
			[ 'p', 'h2', 'img' ].map( query ) );
}

function selectBlock( event ) {
	clearBlocks();
	event.stopPropagation();
	event.target.className += ' is-selected';

	selectedBlock = event.target;
	showControls( selectedBlock );
}

function clearBlocks() {
	Array.from( getBlocks() ).forEach( function( block ) {
		block.className = block.className.replace( 'is-selected', '' );
	} );
	var selectedBlock = null;

	hideControls();
	hideMenu();
}

function showControls( node ) {
	// show element type
	document.getElementsByClassName( 'type-icon-image' )[0].style.display = 'none';
	document.getElementsByClassName( 'type-icon-heading' )[0].style.display = 'none';
	document.getElementsByClassName( 'type-icon-paragraph' )[0].style.display = 'none';
	if ( node.nodeName == 'IMG' ) {
		document.getElementsByClassName( 'type-icon-image' )[0].style.display = 'block';
		blockControls.className = 'block-controls is-image';
	} else if ( node.nodeName == 'H1' || node.nodeName == 'H2' || node.nodeName == 'H3' || node.nodeName == 'H4' || node.nodeName == 'H5' || node.nodeName == 'H6' ) {
		document.getElementsByClassName( 'type-icon-heading' )[0].style.display = 'block';
		blockControls.className = 'block-controls is-heading';
	} else {
		document.getElementsByClassName( 'type-icon-paragraph' )[0].style.display = 'block';
		blockControls.className = 'block-controls is-text';
	}

	var imageFullBleed = document.getElementsByClassName( 'block-image__full-width' )[0];
	var imageAlignNone = document.getElementsByClassName( 'block-image__no-align' )[0];
	var imageAlignLeft = document.getElementsByClassName( 'block-image__align-left' )[0];
	var imageAlignRight = document.getElementsByClassName( 'block-image__align-right' )[0];
	imageFullBleed.addEventListener( 'click', setImageFullBleed, false );
	imageAlignNone.addEventListener( 'click', setImageAlignNone, false );
	imageAlignLeft.addEventListener( 'click', setImageAlignLeft, false );
	imageAlignRight.addEventListener( 'click', setImageAlignRight, false );

	// show controls
	var position = node.getBoundingClientRect();
	switcher.style.opacity = 1;
	switcher.style.top = ( position.top + 18 + window.scrollY ) + 'px';

	blockControls.style.display = 'block';
	blockControls.style.top = ( position.top - 36 + window.scrollY ) + 'px';
	blockControls.style.maxHeight = 'none';
}

function hideControls() {
	switcher.style.opacity = 0;
	blockControls.style.display = 'none';
	blockControls.style.maxHeight = 0;
}

// Show popup on text selection
function onSelectText( event ) {
	event.stopPropagation();
	var txt = "";

	if ( window.getSelection ) {
		txt = window.getSelection();
	} else if ( document.getSelection ) {
		txt = document.getSelection();
	} else if ( document.selection ) {
		txt = document.selection.createRange().text;
	}

	// Show formatting bar
	if ( txt != '' ) {
		inlineControls.style.display = 'block';
		var range = txt.getRangeAt(0);
		var pos = range.getBoundingClientRect();
		var selectCenter = pos.width / 2;
		var controlsCenter = inlineControls.offsetWidth / 2;
		inlineControls.style.left = ( pos.left + selectCenter - controlsCenter ) + 'px';
		inlineControls.style.top = ( pos.top - 48 + window.scrollY ) + 'px';
	} else {
		inlineControls.style.display = 'none';
	}
}

function attachControlActions() {
	Array.from( switcher.childNodes ).forEach( function( node ) {
		if ( 'svg' !== node.nodeName ) {
			return;
		}

		var classes = node.className.baseVal;

		if ( 'up' === classes ) {
			node.addEventListener( 'click', function() {
				event.stopPropagation();
				swapNodes( selectedBlock, getPreviousSibling( selectedBlock ) );
				attachBlockHandlers();
				reselect();
			}, false );
		} else if ( 'down' === classes ) {
			node.addEventListener( 'click', function() {
				event.stopPropagation();
				swapNodes( selectedBlock, getNextSibling( selectedBlock ) );
				attachBlockHandlers();
				reselect();
			}, false );
		}
	} );
}

function reselect() {
	document.getElementsByClassName( 'is-selected' )[0].click();
}

function swapNodes( a, b ) {
	if ( ! ( a && b ) ) {
		return false;
	}

	var parent = a.parentNode;
	if ( ! parent ) {
		return false;
	}

	// insert node copies before removal
	parent.replaceChild( b.cloneNode( true ), a );
	parent.replaceChild( a.cloneNode( true ), b );

	return true;
}

/**
 * Utility functions
 */
function siblingGetter( direction ) {
	var sibling = direction + 'Sibling';

	return function getAdjacentSibling( node ) {
		if ( null === node ) {
			return null;
		}

		if ( null === node[ sibling ] ) {
			return null;
		}

		if ( '#text' === node[ sibling ].nodeName ) {
			return getAdjacentSibling( node[ sibling ] );
		}

		return node[ sibling ];
	}
}

function openBlockMenu( event ) {
	event.stopPropagation();
	var menu = document.getElementsByClassName( 'insert-block__menu' )[0];
	menu.style.display = 'block';
	menu.addEventListener( 'click', function( event ) {
		event.stopPropagation();
	}, false );
}

function hideMenu() {
	var menu = document.getElementsByClassName( 'insert-block__menu' )[0];
	menu.style.display = 'none';
}

function setImageFullBleed( event ) {
	event.stopPropagation();
	var image = query('img')[0];
	console.log(image);
	image.className = 'is-selected align-full-bleed';
}

function setImageAlignNone( event ) {
	event.stopPropagation();
	var image = query('img')[0];
	console.log(image);
	image.className = 'is-selected';
}

function setImageAlignLeft( event ) {
	event.stopPropagation();
	var image = query('img')[0];
	image.className = 'is-selected align-left';
}

function setImageAlignRight( event ) {
	event.stopPropagation();
	var image = query('img')[0];
	image.className = 'is-selected align-right';
}

function l( data ) {
	console.log( data );
	return data;
}

function query( selector ) {
	return Array.from( document.querySelectorAll( selector ) );
}
