/* Block Definitions */
var config = {
	globalControls: {
		up: {
			icon: '<svg width="18" height="18" class="up" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"><path d="M2 11l7-7 7 7-1.4 1.4L9 6.8l-5.6 5.6"/></svg>'
		},
		down: {
			icon: '<svg width="18" height="18" class="down" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"><path d="M16 6.414l-7 7-7-7 1.4-1.4 5.6 5.6 5.6-5.6"/></svg>'
		}
	},
	controls: {
		alignLeft: {
			icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Align Left</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M4 19h16v-2H4v2zm10-6H4v2h10v-2zM4 9v2h16V9H4zm10-4H4v2h10V5z"/></g></svg>'
		},
		alignCenter: {
			icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Align Center</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M4 19h16v-2H4v2zm13-6H7v2h10v-2zM4 9v2h16V9H4zm13-4H7v2h10V5z"/></g></svg>'
		},
		alignRight: {
			icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Align Right</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M20 17H4v2h16v-2zm-10-2h10v-2H10v2zM4 9v2h16V9H4zm6-2h10V5H10v2z"/></g></svg>'
		},
		imageNoAlign: {
			icon: '<svg class="gridicon gridicons-align-image-center" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M3 5h18v2H3V5zm0 14h18v-2H3v2zm5-4h8V9H8v6z"></path></g></svg>'
		},
		imageAlignLeft: {
			icon: '<svg class="gridicon gridicons-align-image-left" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M3 5h18v2H3V5zm0 14h18v-2H3v2zm0-4h8V9H3v6zm10 0h8v-2h-8v2zm0-4h8V9h-8v2z"></path></g></svg>'
		},
		imageAlignRight: {
			icon: '<svg class="gridicon gridicons-align-image-right" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M21 7H3V5h18v2zm0 10H3v2h18v-2zm0-8h-8v6h8V9zm-10 4H3v2h8v-2zm0-4H3v2h8V9z"></path></g></svg>'
		},
		imageFullWidth: {
			icon: '<svg class="gridicon gridicons-fullscreen" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><title>Full Bleed</title><path d="M21 3v6h-2V6.41l-3.29 3.3-1.42-1.42L17.59 5H15V3zM3 3v6h2V6.41l3.29 3.3 1.42-1.42L6.41 5H9V3zm18 18v-6h-2v2.59l-3.29-3.29-1.41 1.41L17.59 19H15v2zM9 21v-2H6.41l3.29-3.29-1.41-1.42L5 17.59V15H3v6z"></path></g></svg>'
		},
		textBold: {
			icon: '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Bold</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M7 5.01h4.547c2.126 0 3.67.302 4.632.906.96.605 1.44 1.567 1.44 2.887 0 .896-.21 1.63-.63 2.205-.42.574-.98.92-1.678 1.036v.103c.95.212 1.637.608 2.057 1.19.42.58.63 1.35.63 2.315 0 1.367-.494 2.434-1.482 3.2-.99.765-2.332 1.148-4.027 1.148H7V5.01zm3 5.936h2.027c.862 0 1.486-.133 1.872-.4.386-.267.578-.708.578-1.323 0-.574-.21-.986-.63-1.236-.42-.25-1.087-.374-1.996-.374H10v3.333zm0 2.523v3.905h2.253c.876 0 1.52-.167 1.94-.502.416-.335.625-.848.625-1.54 0-1.243-.89-1.864-2.668-1.864H10z"/></g></svg>'
		},
		textItalic: {
			icon: '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Italic</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M10.536 5l-.427 2h1.5L9.262 18h-1.5l-.427 2h6.128l.426-2h-1.5l2.347-11h1.5l.427-2"/></g></svg>'
		},
		link: {
			icon: '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Link</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M17 13H7v-2h10v2zm1-6h-1c-1.63 0-3.065.792-3.977 2H18c1.103 0 2 .897 2 2v2c0 1.103-.897 2-2 2h-4.977c.913 1.208 2.347 2 3.977 2h1c2.21 0 4-1.79 4-4v-2c0-2.21-1.79-4-4-4zM2 11v2c0 2.21 1.79 4 4 4h1c1.63 0 3.065-.792 3.977-2H6c-1.103 0-2-.897-2-2v-2c0-1.103.897-2 2-2h4.977C10.065 7.792 8.63 7 7 7H6c-2.21 0-4 1.79-4 4z"/></g></svg>'
		},
		textStrikeThrought: {
			icon: '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Strikethrough</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M14.348 12H21v2h-4.613c.24.515.368 1.094.368 1.748 0 1.317-.474 2.355-1.423 3.114-.947.76-2.266 1.138-3.956 1.138-1.557 0-2.934-.293-4.132-.878v-2.874c.985.44 1.818.75 2.5.928.682.18 1.306.27 1.872.27.68 0 1.2-.13 1.562-.39.363-.26.545-.644.545-1.158 0-.285-.08-.54-.24-.763-.16-.222-.394-.437-.704-.643-.18-.12-.483-.287-.88-.49H3v-2H14.347zm-3.528-2c-.073-.077-.143-.155-.193-.235-.126-.202-.19-.44-.19-.713 0-.44.157-.795.47-1.068.313-.273.762-.41 1.348-.41.492 0 .993.064 1.502.19.51.127 1.153.35 1.93.67l1-2.405c-.753-.327-1.473-.58-2.16-.76-.69-.18-1.414-.27-2.173-.27-1.544 0-2.753.37-3.628 1.108-.874.738-1.312 1.753-1.312 3.044 0 .302.036.58.088.848h3.318z"/></g></svg>'
		},
		textColor: {
			icon: '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Text Color</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M3 19h18v3H3v-3zM15.82 17h3.424L14 3h-4L4.756 17H8.18l1.067-3.5h5.506L15.82 17zm-1.952-6h-3.73l1.868-5.725L13.868 11z"/></g></svg>'
		}
	},
	blockCategories: [
		{ id: 'common', label: 'Common' },
		{ id: 'media', label: 'Media' },
		{ id: 'embeds', label: 'Embeds' },
		{ id: 'other', label: 'Other' },
		{ id: 'layout', label: 'Layout' }
	],
	blocks: {
		text: {
			id: 'text',
			label: 'Text',
			render: renderRaw,
			update: updateRaw,
			blockControls: [ 'alignLeft', 'alignCenter', 'alignRight' ],
			inlineControls: [ 'textBold', 'textItalic', 'link', 'textStrikeThrought', 'textColor' ],
			icon: '<svg height="24" width="24" class="type-icon-paragraph" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path id="path-1_2_" class="st0" d="M13 5h2v16h2V5h2V3h-6.7.2-3C6.5 3 4 5.5 4 8.5S6.5 14 9.5 14H11v7h2v-7h-.5.5V5z"/><path class="st1" d="M9.5 3C6.5 3 4 5.5 4 8.5S6.5 14 9.5 14H11v7h2V5h2v16h2V5h2V3H9.5z"/></svg>',
			switch: [ 'paragraph', 'heading' ],
			category: 'common'
		},
		image: {
			id: 'image',
			label: 'Image',
			render: renderRaw,
			update: updateRaw,
			blockControls: [ 'imageNoAlign', 'imageAlignLeft', 'imageAlignRight', 'imageFullWidth' ],
			icon: '<svg width="24" height="24" class="type-icon-image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Image</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M13 9.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5zM22 6v12c0 1.105-.895 2-2 2H4c-1.105 0-2-.895-2-2V6c0-1.105.895-2 2-2h16c1.105 0 2 .895 2 2zm-2 0H4v7.444L8 9l5.895 6.55 1.587-1.85c.798-.932 2.24-.932 3.037 0L20 15.426V6z"/></g></svg>',
			category: 'common'
		},
		heading: {
			id: 'heading',
			label: 'Heading',
			render: renderHeading,
			update: updateHeading,
			blockControls: [ 'alignLeft', 'alignCenter', 'alignRight' ],
			inlineControls: [ 'textBold', 'textItalic', 'link', 'textStrikeThrought', 'textColor' ],
			icon: '<svg height="24" width="24" class="type-icon-heading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Heading</title><rect x="0" fill="none" width="24" height="24"/><g><path d="M18 20h-3v-6H9v6H6V5.01h3V11h6V5.01h3V20z"/></g></svg>',
			switch: [ 'paragraph', 'heading' ],
			category: 'common'
		},
		paragraph: {
			id: 'paragraph',
			label: 'Paragraph',
			render: renderParagraph,
			update: updateParagraph,
			blockControls: [ 'alignLeft', 'alignCenter', 'alignRight' ],
			inlineControls: [ 'textBold', 'textItalic', 'link', 'textStrikeThrought', 'textColor' ],
			icon: '<svg height="24" width="24" class="type-icon-paragraph" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path id="path-1_2_" class="st0" d="M13 5h2v16h2V5h2V3h-6.7.2-3C6.5 3 4 5.5 4 8.5S6.5 14 9.5 14H11v7h2v-7h-.5.5V5z"/><path class="st1" d="M9.5 3C6.5 3 4 5.5 4 8.5S6.5 14 9.5 14H11v7h2V5h2v16h2V5h2V3H9.5z"/></svg>',
			switch: [ 'paragraph', 'heading' ],
			category: 'common'
		}
	}
}

function renderParagraph( block, blockNode ) {
	var headingNode = document.createElement( 'p' );
	headingNode.innerHTML = contentFromBlockRawContent( block.rawContent );
	blockNode.appendChild( headingNode );
}

function renderHeading( block, blockNode ) {
	var headingNode = document.createElement( 'h2' );
	headingNode.innerHTML = contentFromBlockRawContent( block.rawContent );
	blockNode.appendChild( headingNode );
}

function renderRaw( block, blockNode ) {
	if ( block.type === 'Text' ) {
		blockNode.innerHTML = block.value;
	} else {
		blockNode.innerHTML = contentFromBlockRawContent( block.rawContent );
	}
}

function updateRaw( block, dom ) {
	var newBlock = Object.assign( {}, block );
	if ( block.type === 'Text' ) {
		newBlock.value = dom.innerHTML;
	} else {
		var matches = /^\<!-- [^]*-->([^]*)<!-- \/[^]*-->$/.exec( block.rawContent );
		newBlock.rawContent = block.rawContent.replace( matches[1], dom.innerHTML );
	}

	return [ newBlock ];
}

function updateHeading( block, dom ) {
	return Array.from( dom.querySelectorAll( 'h2' ) ).map( function( domElement ) {
		return updateRaw( block, domElement )[ 0 ];
	} );
}

function updateParagraph( block, dom ) {
	return Array.from( dom.querySelectorAll( 'p' ) ).map( function( domElement ) {
		return updateRaw( block, domElement )[ 0 ];
	} );
}

/* Rendering functions */
var state = {
	firstRender: true,
	selectedBlock: null,
	switchMenuOpen: false,
	insertMenuOpen: false,
	searchBlockFilter: '',
	selectedBlockToInsert: null,
	blocks: window.parser.parse( window.initialContent )
};

function renderEditor( editor, controlsContainer ) {
	editor.innerHTML = '';
	state.blocks.forEach( function( block, index ) {
		var blockDomElement = renderBlock( block, index );
		blockDomElement && editor.appendChild( blockDomElement );
	} );

	if ( state.firstRender ) {
		state.firstRender = false;
		editor.addEventListener( 'input', syncBlockContent );

		function syncBlockContent() {
			var newBlocks = state.blocks
				.map( function( block, index ) {
					return {
						domElements: editor.querySelectorAll( '.block.block-' + index ),
						definition: getBlockDefinition( block ),
						block: block
					};
				} )
				.filter( function( blockConfig ) { return !! blockConfig.domElements || ! blockConfig.domElements.length; } )
				.reduce( function( memo, blockConfig ) {
					var configs = [];
					blockConfig.domElements.forEach( function( domElement ) {
						memo.push( {
							dom: domElement,
							definition: blockConfig.definition,
							block: blockConfig.block
						} );
					} );

					return memo;
				}, [] )
				.reduce( function( memo, blockConfig ) {
					return memo.concat( blockConfig.definition.update( blockConfig.block, blockConfig.dom ) );
				}, [] );

			state.blocks = newBlocks;
			state.selectedBlock = null;
			refresh();
		}
	}

	renderControls( controlsContainer );
}

function renderBlock( block, index ) {
	var blockDefinition = getBlockDefinition( block );
	if ( ! blockDefinition ) return;
	var blockNode = document.createElement( 'div' );
	blockNode.className = ( state.selectedBlock === index ? 'is-selected' : '' ) + ' block block-' + index ;
	blockNode.setAttribute( 'data-type', blockDefinition.id );
	blockNode.addEventListener( 'click', selectBlock, false );
	blockDefinition.render( block, blockNode );

	function selectBlock( event ) {
		state.selectedBlock = index;
		state.switchMenuOpen = false;
		state.insertMenuOpen = false;
		refresh();
	}

	return blockNode;
}

function renderControls( controlsContainer ) {
	controlsContainer.innerHTML = '';
	renderInserterMenu( controlsContainer );

	if ( state.selectedBlock === null ) return;
	var blockNode = document.querySelector( '.block-' + state.selectedBlock );
	var blockDefinition = getBlockDefinition( state.blocks[ state.selectedBlock ] );
	var position = blockNode.getBoundingClientRect();
	renderDockedControls( controlsContainer, blockDefinition, position );
	renderSwitcherControls( controlsContainer, blockDefinition, position );
	renderSwitcherMenu( controlsContainer, blockDefinition, position );
}

function renderInserterMenu( controlsContainer ) {
	var insertNode = document.createElement( 'div' );
	insertNode.className = 'insert-block';
	controlsContainer.appendChild( insertNode );

	// Insert Menu Button
	var insertMenuButton = document.createElement( 'button' );
	insertMenuButton.className = 'insert-block__button';
	insertMenuButton.innerHTML = '<svg class="gridicon gridicons-add-outline" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M12 4c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8m0-2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm5 9h-4V7h-2v4H7v2h4v4h2v-4h4v-2z"></path></g></svg>';
	insertNode.appendChild( insertMenuButton );
	insertMenuButton.addEventListener( 'click', openInsertMenu, false );
	function openInsertMenu() {
		state.insertMenuOpen = !state.insertMenuOpen;
		state.switchMenuOpen = false;
		state.selectedBlock = null;
		refresh();
	}

	// Insert Menu Content
	if ( ! state.insertMenuOpen ) return;
	var insertMenuNode = document.createElement( 'div' );
	insertMenuNode.className = 'insert-block__menu popover is-top';
	insertMenuNode.innerHTML = '<div class="popover__arrow"></div>';
	insertMenuContentNode = document.createElement( 'div' );
	insertMenuContentNode.className = 'insert-block__content';
	insertMenuNode.appendChild( insertMenuContentNode );

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
		var categoryBlocks = Object.values( config.blocks )
			.filter( function( block ) {
				return block.category === category.id
					&& block.label.toLowerCase().indexOf( state.searchBlockFilter.toLowerCase() ) !== -1;
			} );
		categoryBlocks
			.forEach( function( block ) {
				var node = document.createElement( 'div' );
				node.className = 'insert-block__block block-' + block.id + ( state.selectedBlockToInsert === block.id ? ' is-active' : '' );
				node.innerHTML = block.icon + ' ' + block.label;
				nodeBlocks.appendChild(node);
			} );
		if ( categoryBlocks.length ) {
			insertMenuContentNode.appendChild( node );
		}
	} );
	insertMenuContentNode.innerHTML += '<input class="insert-block__search" type="search" placeholder="Search..." />';
	insertNode.appendChild( insertMenuNode );
}

function renderDockedControls( controlsContainer, blockDefinition, position ) {
	var controlsNode = document.createElement( 'div' );
	controlsNode.className = 'docked-controls';

	// Block & Inline Controls
	var controlTypes = [ 'blockControls', 'inlineControls' ];
	controlTypes.forEach( function( controlType ) {
		if ( ! blockDefinition[ controlType ] ) return;
		var toolbarNode = document.createElement( 'div' );
		toolbarNode.className = 'controls-toolbar';
		controlsNode.appendChild( toolbarNode );
		blockDefinition[ controlType ].forEach( function( controlId ) {
			var control = config.controls[ controlId ];
			var button = document.createElement( 'button' );
			button.innerHTML = control.icon;
			toolbarNode.appendChild( button );
		} );
	} );
	var topPosition = position.top - 36 + window.scrollY;
	var leftPosition = null;
	controlsNode.style.maxHeight = 'none';
	controlsNode.style.top = topPosition + 'px';
	controlsNode.style.left = leftPosition ? leftPosition + 'px' : null;
	controlsContainer.appendChild( controlsNode );
}

function renderSwitcherControls( controlsContainer, blockDefinition, position ) {
	// Switcher Controls
	var switcherNode = document.createElement( 'div' );
	switcherNode.className = 'block-switcher';
	[ 'up', 'down' ].forEach( function ( globalControlId ) {
		var globalControl = config.globalControls[ globalControlId ];
		switcherNode.innerHTML += globalControl.icon;
	} );
	var blockIconNode = document.createElement( 'span' );
	blockIconNode.className = 'type';
	blockIconNode.innerHTML = blockDefinition.icon;
	blockIconNode.addEventListener( 'click', openSwitchMenu, false );
	switcherNode.appendChild( blockIconNode );
	controlsContainer.appendChild( switcherNode );
	switcherNode.style.top = ( position.top + 18 + window.scrollY ) + 'px';
	function openSwitchMenu( event ) {
		if ( ! blockDefinition.switch ) return;
		event.stopPropagation();
		state.switchMenuOpen = ! state.switchMenuOpen;
		state.insertMenuOpen = false;
		refresh();
	}
}

function renderSwitcherMenu( controlsContainer, blockDefinition, position ) {
	// Switch Block Menu
	if ( ! state.switchMenuOpen || ! blockDefinition.switch ) return;

	var switchMenuNode = document.createElement( 'div' );
	switchMenuNode.className = 'switch-block__menu popover is-bottom';
	switchMenuNode.innerHTML = '<div class="popover__arrow"></div>';
	var switchBlockListNode = document.createElement( 'div' );
	switchBlockListNode.className = 'switch-block__block-list';
	switchMenuNode.appendChild( switchBlockListNode );
	blockDefinition.switch.forEach( function( blockId ) {
		var switchToBlockDefinition = config.blocks[ blockId ];
		var switchToBlockNode = document.createElement( 'div' );
		switchToBlockNode.className = 'switch-block__block';
		switchToBlockNode.innerHTML = switchToBlockDefinition.icon + '<label>' + switchToBlockDefinition.label + '</label>';
		switchBlockListNode.appendChild( switchToBlockNode );
	} );
	switchMenuNode.style.top = ( position.top + 60 + window.scrollY ) + 'px';
	switchMenuNode.style.left = ( position.left - 90 + window.scrollX ) + 'px';
	controlsContainer.appendChild( switchMenuNode );
}

/* Utils */
function getBlockDefinition( block ) {
	return block.type === 'Text' ? config.blocks.text : config.blocks[ block.blockType ];
}

function contentFromBlockRawContent( rawContent ) {
	var matches = /^\<!-- [^]*-->([^]*)<!-- \/[^]*-->$/.exec( rawContent );
	var html = matches[1];

	return html;
}

/* function saveSelection(containerEl) {
    var charIndex = 0, start = 0, end = 0, foundStart = false, stop = {};
    var sel = rangy.getSelection(), range;

    function traverseTextNodes(node, range) {
        if (node.nodeType == 3) {
            if (!foundStart && node == range.startContainer) {
                start = charIndex + range.startOffset;
                foundStart = true;
            }
            if (foundStart && node == range.endContainer) {
                end = charIndex + range.endOffset;
                throw stop;
            }
            charIndex += node.length;
        } else {
            for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                traverseTextNodes(node.childNodes[i], range);
            }
        }
    }

    if (sel.rangeCount) {
        try {
            traverseTextNodes(containerEl, sel.getRangeAt(0));
        } catch (ex) {
            if (ex != stop) {
                throw ex;
            }
        }
    }

    return {
        start: start,
        end: end
    };
}

function restoreSelection(containerEl, savedSel) {
    var charIndex = 0, range = rangy.createRange(), foundStart = false, stop = {};
    range.collapseToPoint(containerEl, 0);

    function traverseTextNodes(node) {
        if (node.nodeType == 3) {
            var nextCharIndex = charIndex + node.length;
            if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                range.setStart(node, savedSel.start - charIndex);
                foundStart = true;
            }
            if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                range.setEnd(node, savedSel.end - charIndex);
                throw stop;
            }
            charIndex = nextCharIndex;
        } else {
            for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                traverseTextNodes(node.childNodes[i]);
            }
        }
    }

    try {
        traverseTextNodes(containerEl);
    } catch (ex) {
        if (ex == stop) {
            rangy.getSelection().setSingleRange(range);
        } else {
            throw ex;
        }
    }
} */


function saveSelection(editor ) {
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            return sel.getRangeAt(0);
        }
    } else if (document.selection && document.selection.createRange) {
        return document.selection.createRange();
    }
    return null;
}

function restoreSelection(editor, range) {
    if (range) {
        if (window.getSelection) {
            sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (document.selection && range.select) {
            range.select();
        }
    }
}


/* Launch */
function refresh() {
	setTimeout( function() {
		var controls = document.querySelector( '.controls' );
		var editor = document.querySelector( '.editor' );
		var reselect = document.activeElement === editor;
		var savedRange;
		if ( reselect ) {
			var savedRange = rangy.getSelection().saveCharacterRanges( editor );
		}
		renderEditor( editor, controls );
		if ( reselect ) {
			// editor.focus();
			rangy.getSelection().restoreCharacterRanges( editor, savedRange );
		}
	} );
}

refresh();
