var RE_BLOCK_OPEN, RE_BLOCK_CLOSE, textarea, editor;

RE_BLOCK_OPEN = /^\s*wp:(\S+)/;
RE_BLOCK_CLOSE = /^\s*\/wp\s*/;

function findNodeBlocks( rootNode ) {
	var stack = [ rootNode ],
		comments = [],
		blocks = [],
		parent, i, node, match, block, child;

	while ( stack.length ) {
		parent = stack.pop();

		for ( i = 0; i < parent.childNodes.length; i++ ) {
			node = parent.childNodes[ i ];

			if ( Node.COMMENT_NODE !== node.nodeType ) {
				stack.push( node );
			} else if ( RE_BLOCK_OPEN.test( node.nodeValue ) ) {
				comments.push( node );
			}
		}
	}

	for ( i = comments.length; --i >= 0; ) {
		node = comments[ i ];
		match = node.nodeValue.match( RE_BLOCK_OPEN );
		block = {
			type: match[ 1 ],
			startNode: node,
			children: []
		};

		child = node;
		while ( ( child = child.nextSibling ) ) {
			if ( Node.COMMENT_NODE !== child.nodeType ) {
				block.children.push( child );
			} else if ( RE_BLOCK_CLOSE.test( child.nodeValue ) ) {
				block.endNode = child;
				break;
			}
		}

		blocks.unshift( block );
	}

	return blocks;
}

function renderBlocks( rootNode ) {
	var blocks = findNodeBlocks( rootNode ),
		i, block, wrapper, hasInlineChild, child;

	for ( i = 0; i < blocks.length; i++ ) {
		block = blocks[ i ];

		if ( ! block.endNode ) {
			continue;
		}

		wrapper = document.createElement( 'div' );
		wrapper.className = 'block';
		wrapper.setAttribute( 'data-type', block.type );

		hasInlineChild = block.children.some( function( node ) {
			return (
				Node.ELEMENT_NODE === node.nodeType &&
				'inline' === window.getComputedStyle( node ).display
			);
		} );

		if ( hasInlineChild ) {
			wrapper.style.display = 'inline-block';
		}

		block.endNode.parentNode.insertBefore( wrapper, block.endNode );

		while ( ( child = block.children.pop() ) ) {
			wrapper.insertBefore( child, wrapper.lastChild );
		}
	}
}

textarea = document.getElementById( 'textarea' );
editor = document.getElementById( 'editor' );

function renderEditor() {
	editor.innerHTML = textarea.value;
	renderBlocks( editor );
}

textarea.addEventListener( 'input', renderEditor );
renderEditor();
