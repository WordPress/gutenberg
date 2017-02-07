"use strict";

var text = document.getElementsByTagName( 'p' );
var heading = document.getElementsByTagName( 'h2' );
var blocks = [ ...text, ...heading ];

var controls = document.getElementsByClassName( 'block-controls' )[0];

window.addEventListener( 'click', clearBlocks, false );

Array.from( blocks ).forEach( function( block ) {
	block.addEventListener( 'click', selectBlock, false );
} );

function selectBlock( event ) {
	clearBlocks();
	event.stopPropagation();
	event.target.className = 'is-selected';

	var position = event.target.getBoundingClientRect();

	// Show switcher
	controls.style.opacity = 1;
	controls.style.top = ( position.top + 18 ) + 'px';
}

function clearBlocks( event ) {
	Array.from( blocks ).forEach( function( block ) {
		block.className = '';
	} );

	hideControls();
}

function hideControls() {
	controls.style.opacity = 0;
}
