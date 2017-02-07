"use strict";

var editor = document.getElementsByClassName( 'editor' )[0];
var controls = document.getElementsByClassName( 'block-controls' )[0];

window.addEventListener( 'click', clearBlocks, false );
editor.addEventListener( 'input', attachBlockHandlers, false );
editor.addEventListener( 'input', clearBlocks, false );

attachBlockHandlers();

function attachBlockHandlers() {
	var blocks = getBlocks();
	Array.from( blocks ).forEach( function( block ) {
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
}

function clearBlocks() {
	Array.from( getBlocks() ).forEach( function( block ) {
		block.className = '';
	} );

	hideControls();
}

function hideControls() {
	controls.style.opacity = 0;
}
