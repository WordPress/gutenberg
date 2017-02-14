"use strict";

/**
 * Derived functions
 */
var getNextSibling = siblingGetter( 'next' );
var getPreviousSibling = siblingGetter( 'previous' );
var getTagType = getConfig.bind( null, 'tagTypes' );
var getTypeKinds = getConfig.bind( null, 'typeKinds' );
var setImageFullBleed = setElementState.bind( null, 'align-full-bleed' );
var setImageAlignNone = setElementState.bind( null, '' );
var setImageAlignLeft = setElementState.bind( null, 'align-left' );
var setImageAlignRight = setElementState.bind( null, 'align-right' );

var setTextAlignLeft = setElementState.bind( null, 'align-left' );
var setTextAlignCenter = setElementState.bind( null, 'align-center' );
var setTextAlignRight = setElementState.bind( null, 'align-right' );

/**
 * Globals
 */
var config = {
	tagTypes: {
		'BLOCKQUOTE': 'quote',
		'H1': 'heading',
		'H2': 'heading',
		'H3': 'heading',
		'H4': 'heading',
		'H5': 'heading',
		'H6': 'heading',
		'IMG': 'image',
		'P': 'paragraph',
		'default': 'paragraph'
	},
	typeKinds: {
		'quote': [ 'text' ],
		'heading': [ 'heading', 'text' ],
		'image': [ 'image' ],
		'paragraph': [ 'text' ],
		'default': []
	}
};

var editor = queryFirst( '.editor' );
var switcher = queryFirst( '.block-switcher' );
var switcherButtons = query( '.block-switcher .type svg' );
var switcherMenu = queryFirst( '.switch-block__menu' );
var blockControls = queryFirst( '.block-controls' );
var inlineControls = queryFirst( '.inline-controls' );
var insertBlockButton = queryFirst( '.insert-block__button' );
var insertBlockMenu = queryFirst( '.insert-block__menu' );
var textAlignLeft = queryFirst( '.block-text__align-left' );
var textAlignCenter = queryFirst( '.block-text__align-center' );
var textAlignRight = queryFirst( '.block-text__align-right' );
var imageFullBleed = queryFirst( '.block-image__full-width' );
var imageAlignNone = queryFirst( '.block-image__no-align' );
var imageAlignLeft = queryFirst( '.block-image__align-left' );
var imageAlignRight = queryFirst( '.block-image__align-right' );

var selectedBlock = null;

var supportedBlockTags = Object.keys( config.tagTypes )
	.slice( 0, -1 ) // remove 'default' option
	.map( function( tag ) { return tag.toLowerCase(); } );

/**
 * Initialization
 */
window.addEventListener( 'click', clearBlocks, false );
editor.addEventListener( 'input', attachBlockHandlers, false );
editor.addEventListener( 'input', clearBlocks, false );
insertBlockButton.addEventListener( 'click', openBlockMenu, false );
insertBlockMenu.addEventListener( 'click', function( event ) {
	event.stopPropagation();
}, false );
window.addEventListener( 'mouseup', onSelectText, false );

attachBlockHandlers();
attachControlActions();
attachTypeSwitcherActions();

/**
 * Core logic
 */
function attachBlockHandlers() {
	getBlocks().forEach( function( block ) {
		block.removeEventListener( 'click', selectBlock, false );
		block.addEventListener( 'click', selectBlock, false );
	} );
}

function getBlocks() {
	return Array.prototype.concat.apply( [],
			supportedBlockTags.map( query ) );
}

function selectBlock( event ) {
	clearBlocks();
	event.stopPropagation();
	event.target.classList.add( 'is-selected' );

	selectedBlock = event.target;
	showControls( selectedBlock );
}

function clearBlocks() {
	getBlocks().forEach( function( block ) {
		block.classList.remove( 'is-selected' );
	} );
	selectedBlock = null;

	hideControls();
	hideMenu();
}

function showControls( node ) {
	// toggle block-specific switcher
	switcherButtons.forEach( function( element ) {
		element.style.display = 'none';
	} );
	var blockType = getTagType( node.nodeName );
	var switcherQuery = '.type-icon-' + blockType;
	queryFirst( switcherQuery ).style.display = 'block';

	// reposition switcher
	var position = node.getBoundingClientRect();
	switcher.style.opacity = 1;
	switcher.style.top = ( position.top + 18 + window.scrollY ) + 'px';

	// show/hide block-specific block controls
	blockControls.className = 'block-controls';
	getTypeKinds( blockType ).forEach( function( kind ) {
		blockControls.classList.add( 'is-' + kind );
	} );
	blockControls.style.display = 'block';

	// reposition block-specific block controls
	blockControls.style.top = ( position.top - 36 + window.scrollY ) + 'px';
	blockControls.style.maxHeight = 'none';
}

function hideControls() {
	switcher.style.opacity = 0;
	switcherMenu.style.display = 'none';
	blockControls.style.display = 'none';
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
		var getter = {
			up: getPreviousSibling,
			down: getNextSibling
		}[ classes ];

		if ( getter ) {
			node.addEventListener( 'click', function( event ) {
				event.stopPropagation();
				swapNodes( selectedBlock, getter( selectedBlock ) );
				attachBlockHandlers();
				reselect();
			}, false );
		}
	} );

	// Text block event handlers.
	textAlignLeft.addEventListener( 'click', setTextAlignLeft, false );
	textAlignCenter.addEventListener( 'click', setTextAlignCenter, false );
	textAlignRight.addEventListener( 'click', setTextAlignRight, false );

	switcherButtons.forEach( function( button ) {
		button.addEventListener( 'click', showSwitcherMenu, false );
	} );

	// Image block event handlers.
	imageFullBleed.addEventListener( 'click', setImageFullBleed, false );
	imageAlignNone.addEventListener( 'click', setImageAlignNone, false );
	imageAlignLeft.addEventListener( 'click', setImageAlignLeft, false );
	imageAlignRight.addEventListener( 'click', setImageAlignRight, false );
}

function attachTypeSwitcherActions() {
	var typeToTag = {
		paragraph: 'p',
		quote: 'blockquote',
		heading: 'h2'
	};

	switcherButtons.forEach( function( button ) {
		button.addEventListener( 'click', showSwitcherMenu, false );
	} );

	Object.keys( typeToTag ).forEach( function( type ) {
		var selector = '.switch-block__block .type-icon-' + type;
		var button = queryFirst( selector );
		var label = queryFirst( selector + ' + label' );

		button.addEventListener( 'click', switchBlockType, false );
		label.addEventListener( 'click', switchBlockType, false );

		function switchBlockType( event ) {
			if ( ! selectedBlock ) {
				return;
			}

			var openingRe = /^<\w+/;
			var closingRe = /\w+>$/;
			var tag = typeToTag[ type ];
			selectedBlock.outerHTML = selectedBlock.outerHTML
				.replace( openingRe, '<' + tag )
				.replace( closingRe, tag + '>' );
			clearBlocks();
			attachBlockHandlers();
		}
	} );
}

function reselect() {
	queryFirst( '.is-selected' ).click();
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
	insertBlockMenu.style.display = 'block';
}

function hideMenu() {
	insertBlockMenu.style.display = 'none';
}

function showSwitcherMenu( event ) {
	event.stopPropagation();

	if ( ! selectedBlock ) {
		return;
	}

	// not all block types can be converted to all block types.
	// filter which lists of types are shown in the menu depending on the
	// selected block, based on _kinds_ (see config)
	var blockType = getTagType( selectedBlock.nodeName );
	var kinds = getTypeKinds( blockType );
	var validClasses = kinds.map( function( kind ) {
		return 'switch-block__block-list-' + kind;
	} );
	query( '.switch-block__block-list' ).forEach( function( switcherGroup ) {
		var shouldShow = containsOneOf( switcherGroup, validClasses );
		switcherGroup.style.display = shouldShow ? 'block' : 'none';
	} );

	// position switcher menu next to type icon
	var position = switcher.getBoundingClientRect();
	switcherMenu.style.top = ( position.top + 42 + window.scrollY ) + 'px';
	switcherMenu.style.left = ( position.left - 32 + window.scrollX ) + 'px';
	switcherMenu.style.display = 'block';
}

function setElementState( className, event ) {
	event.stopPropagation();
	selectedBlock.className = 'is-selected';
	if ( className ) {
		selectedBlock.classList.add( className );
	}
}

function l( data ) {
	console.log.apply( console.log, arguments );
	return data;
}

function query( selector ) {
	return Array.from( document.querySelectorAll( selector ) );
}

function queryFirst( selector ) {
	return query( selector )[ 0 ];
}

function getConfig( configName, tagName ) {
	return config[ configName ][ tagName ] ||
		config[ configName ].default;
}

function containsOneOf( element, classes ) {
	return classes.some( function( className ) {
		return element.classList.contains( className );
	} );
}
