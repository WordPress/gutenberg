"use strict";

var text = document.getElementsByTagName( 'p' );
var heading = document.getElementsByTagName( 'h2' );
var blocks = [ ...text, ...heading ];

window.addEventListener( 'click', clearBlocks, false );

Array.from( blocks ).forEach( function( block ) {
	block.addEventListener( 'click', selectBlock, false );
} );

function selectBlock( event ) {
	clearBlocks();
	event.stopPropagation();
	event.target.className = 'is-selected';
}

function clearBlocks( event ) {
	Array.from( blocks ).forEach( function( block ) {
		block.className = '';
	} );
}
