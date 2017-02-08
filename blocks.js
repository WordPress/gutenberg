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
var controls = document.getElementsByClassName( 'block-controls' )[0];
var selectedBlock = null;

/**
 * Initialization
 */

window.addEventListener( 'click', clearBlocks, false );
editor.addEventListener( 'input', attachBlockHandlers, false );
editor.addEventListener( 'input', clearBlocks, false );

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
	var text = document.getElementsByTagName( 'p' );
	var heading = document.getElementsByTagName( 'h2' );
	var images = document.getElementsByTagName( 'img' );
	return [ ...text, ...heading, ...images ];
}

function selectBlock( event ) {
	clearBlocks();
	event.stopPropagation();
	event.target.className = 'is-selected';

	var position = event.target.getBoundingClientRect();

	// Show switcher
	controls.style.opacity = 1;
	controls.style.top = ( position.top + 18 ) + 'px';
	selectedBlock = event.target;
}

function clearBlocks() {
	Array.from( getBlocks() ).forEach( function( block ) {
		block.className = '';
	} );
	var selectedBlock = null;

	hideControls();
}

function hideControls() {
	controls.style.opacity = 0;
}

function attachControlActions() {
	Array.from( controls.childNodes ).forEach( function( node ) {
		if ( 'svg' !== node.nodeName ) {
			return;
		}

		var classes = node.className.baseVal;

		if ( 'up' === classes ) {
			node.addEventListener( 'click', function() {
				swapNodes( selectedBlock, getPreviousSibling( selectedBlock ) );
				attachBlockHandlers();
			}, false );
		} else if ( 'down' === classes ) {
			node.addEventListener( 'click', function() {
				swapNodes( selectedBlock, getNextSibling( selectedBlock ) );
				attachBlockHandlers();
			}, false );
		}
	} );
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

function l( data ) {
	console.log( data );
	return data;
}