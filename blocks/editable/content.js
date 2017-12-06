import { renderToString } from '@wordpress/element';
import { last } from 'lodash';
import { childrenToReact } from './tree';

export function nodeListToReact( editor, nodeList ) {
	const fragment = editor.getDoc().createDocumentFragment();

	nodeList.forEach( function( node ) {
		fragment.appendChild( node.cloneNode( true ) );
	} );

	return childrenToReact( editor.serializer.serialize( fragment, { format: 'tree' } ) );
}

function splitResult( before, after ) {
	return { before: before, after: after };
}

export function setContent( editor, content ) {
	if ( ! content ) {
		content = '';
	}

	content = renderToString( content );
	editor.setContent( content, { format: 'raw' } );
}

export function getContent( editor ) {
	return childrenToReact( editor.getContent( { format: 'tree' } ) );
}

export function getSplitAtLine( editor ) {
	const rootNode = editor.getBody();
	const selectedNode = editor.selection.getNode();

	if ( selectedNode.parentNode !== rootNode ) {
		return null;
	}

	const dom = editor.dom;

	if ( ! dom.isEmpty( selectedNode ) ) {
		return null;
	}

	const childNodes = Array.from( rootNode.childNodes );
	const index = dom.nodeIndex( selectedNode );
	const beforeNodes = childNodes.slice( 0, index );
	const afterNodes = childNodes.slice( index + 1 );
	const beforeElement = nodeListToReact( editor, beforeNodes );
	const afterElement = nodeListToReact( editor, afterNodes );

	return splitResult( beforeElement, afterElement );
}

export function splitAtCaret( editor ) {
	const { dom } = editor;
	const rootNode = editor.getBody();
	const beforeRange = dom.createRng();
	const afterRange = dom.createRng();
	const selectionRange = editor.selection.getRng();

	beforeRange.setStart( rootNode, 0 );
	beforeRange.setEnd( selectionRange.startContainer, selectionRange.startOffset );

	afterRange.setStart( selectionRange.endContainer, selectionRange.endOffset );
	afterRange.setEnd( rootNode, dom.nodeIndex( rootNode.lastChild ) + 1 );

	const beforeFragment = beforeRange.cloneContents();
	const afterFragment = afterRange.cloneContents();

	const beforeElement = nodeListToReact( editor, beforeFragment.childNodes );
	const afterElement = nodeListToReact( editor, afterFragment.childNodes );

	return splitResult( beforeElement, afterElement );
}

export function splitAtBlock( editor ) {
	// Getting the content before and after the cursor
	const childNodes = Array.from( editor.getBody().childNodes );
	let selectedChild = editor.selection.getStart();
	while ( childNodes.indexOf( selectedChild ) === -1 && selectedChild.parentNode ) {
		selectedChild = selectedChild.parentNode;
	}
	const splitIndex = childNodes.indexOf( selectedChild );
	if ( splitIndex === -1 ) {
		return null;
	}
	const beforeNodes = childNodes.slice( 0, splitIndex );
	const lastNodeBeforeCursor = last( beforeNodes );
	// Avoid splitting on single enter
	if (
		! lastNodeBeforeCursor ||
			beforeNodes.length < 2 ||
			!! lastNodeBeforeCursor.textContent
	) {
		return null;
	}

	const before = beforeNodes.slice( 0, beforeNodes.length - 1 );

	// Removing empty nodes from the beginning of the "after"
	// avoids empty paragraphs at the beginning of newly created blocks.
	const after = childNodes.slice( splitIndex ).reduce( ( memo, node ) => {
		if ( ! memo.length && ! node.textContent ) {
			return memo;
		}

		memo.push( node );
		return memo;
	}, [] );

	const beforeElement = nodeListToReact( editor, before );
	const afterElement = nodeListToReact( editor, after );

	return splitResult( beforeElement, afterElement );
}
