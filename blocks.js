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
	},
	blockCategories: [
		{ id: 'frequent', label: 'Frequently Used' },
		{ id: 'media', label: 'Media' }
	],
	blocks: [
		{
			id: 'paragraph',
			label: 'Paragraph',
			icon: '<svg height="24" width="24" class="type-icon-paragraph" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path id="path-1_2_" class="st0" d="M13 5h2v16h2V5h2V3h-6.7.2-3C6.5 3 4 5.5 4 8.5S6.5 14 9.5 14H11v7h2v-7h-.5.5V5z"/><path class="st1" d="M9.5 3C6.5 3 4 5.5 4 8.5S6.5 14 9.5 14H11v7h2V5h2v16h2V5h2V3H9.5z"/></svg>',
			category: 'frequent'
		},
		{
			id: 'heading',
			label: 'Heading',
			icon: '<svg height="24" width="24" class="type-icon-heading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Heading</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M18 20h-3v-6H9v6H6V5.01h3V11h6V5.01h3V20z"/></g></svg>',
			category: 'frequent'
		},
		{
			id: 'image',
			label: 'Image',
			icon: '<svg width="24" height="24" class="type-icon-image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Image</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M13 9.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5zM22 6v12c0 1.105-.895 2-2 2H4c-1.105 0-2-.895-2-2V6c0-1.105.895-2 2-2h16c1.105 0 2 .895 2 2zm-2 0H4v7.444L8 9l5.895 6.55 1.587-1.85c.798-.932 2.24-.932 3.037 0L20 15.426V6z"/></g></svg>',
			category: 'frequent'
		},
		{
			id: 'quote',
			label: 'Quote',
			icon: '<svg class="gridicon gridicons-quote" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.956.76-3.022.66-1.065 1.515-1.867 2.558-2.403L9.373 5c-.8.396-1.56.898-2.26 1.505-.71.607-1.34 1.305-1.9 2.094s-.98 1.68-1.25 2.69-.346 2.04-.217 3.1c.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.368l.002.003zm9.124 0c0-.88-.23-1.618-.69-2.217-.326-.42-.77-.692-1.327-.817-.56-.124-1.074-.13-1.54-.022-.16-.94.09-1.95.75-3.02.66-1.06 1.514-1.86 2.557-2.4L18.49 5c-.8.396-1.555.898-2.26 1.505-.708.607-1.34 1.305-1.894 2.094-.556.79-.97 1.68-1.24 2.69-.273 1-.345 2.04-.217 3.1.165 1.4.615 2.52 1.35 3.35.732.833 1.646 1.25 2.742 1.25.967 0 1.768-.29 2.402-.876.627-.576.942-1.365.942-2.368v.01z"></path></g></svg>',
			category: 'frequent'
		},
		{
			id: 'gallery',
			label: 'Gallery',
			icon: '<svg class="gridicon gridicons-image-multiple" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M15 7.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5S17.328 9 16.5 9 15 8.328 15 7.5zM4 20h14c0 1.105-.895 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.105.895-2 2-2v14zM22 4v12c0 1.105-.895 2-2 2H8c-1.105 0-2-.895-2-2V4c0-1.105.895-2 2-2h12c1.105 0 2 .895 2 2zM8 4v6.333L11 7l4.855 5.395.656-.73c.796-.886 2.183-.886 2.977 0l.513.57V4H8z"></path></g></svg>',
			category: 'media'
		},
		{
			id: 'unordered-list',
			label: 'Unordered List',
			icon: '<svg class="gridicon gridicons-list-unordered" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M9 19h12v-2H9v2zm0-6h12v-2H9v2zm0-8v2h12V5H9zm-4-.5c-.828 0-1.5.672-1.5 1.5S4.172 7.5 5 7.5 6.5 6.828 6.5 6 5.828 4.5 5 4.5zm0 6c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm0 6c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5z"></path></g></svg>',
			category: 'frequent'
		},
		{
			id: 'ordered-list',
			label: 'Ordered List',
			icon: '<svg class="gridicon gridicons-list-ordered" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M8 19h13v-2H8v2zm0-6h13v-2H8v2zm0-8v2h13V5H8zm-4.425.252c.107-.096.197-.188.27-.275-.013.228-.02.48-.02.756V8h1.176V3.717H3.96L2.487 4.915l.6.738.487-.4zm.334 7.764c.474-.426.784-.715.93-.867.145-.153.26-.298.35-.436.087-.138.152-.278.194-.42.042-.143.063-.298.063-.466 0-.225-.06-.427-.18-.608s-.29-.32-.507-.417c-.218-.1-.465-.148-.742-.148-.22 0-.42.022-.596.067s-.34.11-.49.195c-.15.085-.337.226-.558.423l.636.744c.174-.15.33-.264.467-.34.138-.078.274-.117.41-.117.13 0 .232.032.304.097.073.064.11.152.11.264 0 .09-.02.176-.055.258-.036.082-.1.18-.192.294-.092.114-.287.328-.586.64L2.42 13.238V14h3.11v-.955H3.91v-.03zm.53 4.746v-.018c.306-.086.54-.225.702-.414.162-.19.243-.42.243-.685 0-.31-.126-.55-.378-.727-.252-.176-.6-.264-1.043-.264-.307 0-.58.033-.816.1s-.47.178-.696.334l.48.773c.293-.183.576-.274.85-.274.147 0 .263.027.35.082s.13.14.13.252c0 .3-.294.45-.882.45h-.27v.87h.264c.217 0 .393.017.527.05.136.03.233.08.294.143.06.064.09.154.09.27 0 .153-.057.265-.173.337-.115.07-.3.106-.554.106-.164 0-.343-.022-.538-.07-.194-.044-.385-.115-.573-.21v.96c.228.088.44.148.637.182.196.033.41.05.64.05.56 0 .998-.114 1.314-.343.315-.228.473-.542.473-.94.002-.585-.356-.923-1.07-1.013z"></path></g></svg>',
			category: 'frequent'
		},
		{
			id: 'embed',
			label: 'Embed',
			icon: '<svg class="gridicon gridicons-video" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M20 4v2h-2V4H6v2H4V4c-1.105 0-2 .895-2 2v12c0 1.105.895 2 2 2v-2h2v2h12v-2h2v2c1.105 0 2-.895 2-2V6c0-1.105-.895-2-2-2zM6 16H4v-3h2v3zm0-5H4V8h2v3zm4 4V9l4.5 3-4.5 3zm10 1h-2v-3h2v3zm0-5h-2V8h2v3z"></path></g></svg>',
			category: 'media'
		}
	]
};

var editor = queryFirst( '.editor' );
var switcher = queryFirst( '.block-switcher' );
var switcherButtons = query( '.block-switcher .type svg' );
var switcherMenu = queryFirst( '.switch-block__menu' );
var blockControls = queryFirst( '.block-controls' );
var inlineControls = queryFirst( '.inline-controls' );
var insertBlockButton = queryFirst( '.insert-block__button' );
var insertBlockMenu = queryFirst( '.insert-block__menu' );
var insertBlockMenuSearchInput = queryFirst( '.insert-block__search' );
var insertBlockMenuContent = queryFirst( '.insert-block__content' )
var textAlignLeft = queryFirst( '.block-text__align-left' );
var textAlignCenter = queryFirst( '.block-text__align-center' );
var textAlignRight = queryFirst( '.block-text__align-right' );
var imageFullBleed = queryFirst( '.block-image__full-width' );
var imageAlignNone = queryFirst( '.block-image__no-align' );
var imageAlignLeft = queryFirst( '.block-image__align-left' );
var imageAlignRight = queryFirst( '.block-image__align-right' );

// Contants
var KEY_ENTER = 13;
var KEY_ARROW_LEFT = 37;
var KEY_ARROW_UP = 38;
var KEY_ARROW_RIGHT = 39;
var KEY_ARROW_DOWN = 40;

// Editor Variables
var selectedBlock = null;

// Block Menu Variables
var previouslyFocusedBlock = null;
var searchBlockFilter = '';
var blockMenuOpened = false;
var menuSelectedBlock = null;

// Helper variables
var orderedBlocks = config.blockCategories.reduce( function( memo, category ) {
	var categoryBlocks = config.blocks.filter( function( block ) {
		return block.category === category.id;
	} );

	return memo.concat( categoryBlocks );
}, [] );

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
attachBlockMenuSearch();
attachKeyboardShortcuts();

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

function getFocusedBlock() {
	var focusedBlocks = getBlocks().filter( function( block ) {
		return block.contains( window.getSelection().anchorNode );
	} );

	return focusedBlocks.length ? focusedBlocks[ 0 ] : null;
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

function hideInlineControls() {
	inlineControls.style.display = 'none';
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

function renderBlockMenu() {
	insertBlockMenuContent.innerHTML = '';
	config.blockCategories.forEach( function ( category ) {
		var node = document.createElement( 'div' );
		node.className = 'insert-block__category category_' + category.id;
		var nodeHeader = document.createElement( 'span' );
		nodeHeader.className = 'insert-block__separator';
		nodeHeader.innerText = category.label;
		var nodeBlocks = document.createElement( 'div' );
		nodeBlocks.className = 'insert_block__category-blocks';
		node.appendChild( nodeHeader );
		node.appendChild( nodeBlocks );
		var categoryBlocks = config.blocks
			.filter( function( block ) {
				return block.category === category.id
					&& block.label.toLowerCase().indexOf( searchBlockFilter.toLowerCase() ) !== -1;
			} );
		categoryBlocks
			.forEach( function( block ) {
				var node = document.createElement( 'div' );
				node.className = 'insert-block__block block-' + block.id + ( menuSelectedBlock === block ? ' is-active' : '' );
				node.innerHTML = block.icon + ' ' + block.label;
				nodeBlocks.appendChild(node);
			} );

		if ( categoryBlocks.length ) {
			insertBlockMenuContent.appendChild( node );
		}
	} );

	var placeholder = document.createElement('div');
	placeholder.className = 'insert-block__separator';
	placeholder.textContent = 'These don\'t work yet.';
	insertBlockMenuContent.appendChild( placeholder );
}

function attachBlockMenuSearch() {
	insertBlockMenuSearchInput.addEventListener( 'keyup', filterBlockMenu, false );
	insertBlockMenuSearchInput.addEventListener( 'input', filterBlockMenu, false );
	selectBlockInMenu();
	renderBlockMenu();

	function filterBlockMenu( event ) {
		searchBlockFilter = event.target.value;
		selectBlockInMenu();
		renderBlockMenu();
	}
}

/**
 * Select a block in the block menu
 * @param direction direction from the current position (up/down/left/right)
 */
function selectBlockInMenu( direction ) {
	var filteredBlocks = orderedBlocks.filter( function( block ) {
		return block.label.toLowerCase().indexOf( searchBlockFilter.toLowerCase() ) !== -1;
	} );
	var countBlocksByCategories = filteredBlocks.reduce( function( memo, block ) {
		if ( ! memo[ block.category ] ) {
			memo[ block.category ] = 0;
		}
		memo[ block.category ]++;
		return memo;
	}, {} );

	var selectedBlockIndex = filteredBlocks.indexOf( menuSelectedBlock );
	selectedBlockIndex = selectedBlockIndex === -1 ? 0 : selectedBlockIndex;
	var currentBlock = filteredBlocks[ selectedBlockIndex ];
	var previousBlock = filteredBlocks[ selectedBlockIndex - 1 ];
	var nextBlock = filteredBlocks[ selectedBlockIndex + 1 ];
	var offset = 0;
	switch ( direction ) {
		case KEY_ARROW_UP:
			offset = (
				currentBlock
				&& filteredBlocks[ selectedBlockIndex - 2 ]
				&& (
					filteredBlocks[ selectedBlockIndex - 2 ].category === currentBlock.category
					|| countBlocksByCategories[ previousBlock.category ] % 2 === 0
				)
			) ? -2 : -1;
			break;
		case KEY_ARROW_DOWN:
			offset = (
				currentBlock
				&& filteredBlocks[ selectedBlockIndex + 2 ]
				&& (
					currentBlock.category === filteredBlocks[ selectedBlockIndex + 2 ].category
					|| filteredBlocks[ selectedBlockIndex + 2 ].category === nextBlock.category
					|| nextBlock.category === currentBlock.category
				)
			) ? 2 : 1;
			break;
		case KEY_ARROW_RIGHT:
			offset = 1;
			break;
		case KEY_ARROW_LEFT:
			offset = -1;
			break;
	}

	menuSelectedBlock = filteredBlocks[ selectedBlockIndex + offset ] || menuSelectedBlock;

	// Hack to wait for the rerender before scrolling
	setTimeout( function() {
		var blockElement = queryFirst( '.insert-block__block.block-' + menuSelectedBlock.id );
		if (
			blockElement && (
				blockElement.offsetTop + blockElement.offsetHeight > insertBlockMenuContent.clientHeight + insertBlockMenuContent.scrollTop
				|| blockElement.offsetTop < insertBlockMenuContent.scrollTop
			)
		) {
			insertBlockMenuContent.scrollTop = blockElement.offsetTop - 23;
		}
	} );
}

function attachKeyboardShortcuts() {
	document.addEventListener( 'keypress', handleKeyPress, false );
	document.addEventListener( 'keydown', handleKeyDown, false );

	function handleKeyPress( event ) {
		if ( '/' === String.fromCharCode( event.keyCode ) && ! blockMenuOpened ) {
			var focusedBlock = getFocusedBlock();
			if ( document.activeElement !== editor || ( focusedBlock && ! focusedBlock.textContent ) ) {
				event.preventDefault();
				openBlockMenu();
			}
		}
	}

	function handleKeyDown( event ) {
		if ( ! blockMenuOpened ) return;
		switch ( event.keyCode  ) {
			case KEY_ENTER:
				event.preventDefault();
				hideMenu();
				break;
			case KEY_ARROW_DOWN:
			case KEY_ARROW_UP:
			case KEY_ARROW_LEFT:
			case KEY_ARROW_RIGHT:
				event.preventDefault();
				selectBlockInMenu( event.keyCode );
				renderBlockMenu();
				break;
		}
	}
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
	hideInlineControls();
	clearBlocks();
	event && event.stopPropagation();
	insertBlockMenu.style.display = 'block';
	blockMenuOpened = true;
	searchBlockFilter = '';
	insertBlockMenuSearchInput.value = '';
	menuSelectedBlock = false;
	previouslyFocusedBlock = getFocusedBlock();
	insertBlockMenuSearchInput.focus();
	selectBlockInMenu();
	renderBlockMenu();
}

function hideMenu() {
	if ( ! blockMenuOpened ) return;
	insertBlockMenu.style.display = 'none';
	blockMenuOpened = false;
	if ( previouslyFocusedBlock ) {
		setCaret( previouslyFocusedBlock );
	}
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

function setCaret( element ) {
	var range = document.createRange();
	range.setStart( element.childNodes[0] ,0 );
	range.collapse( true );
	var selection = window.getSelection();
	selection.removeAllRanges();
	selection.addRange( range );
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
