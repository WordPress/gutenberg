import { drop } from 'lodash';

function getChildIndex( child ) {
	return Array.from( child.parentNode.childNodes ).indexOf( child );
}

function fillPath( path, node, rootNode ) {
	while ( node !== rootNode ) {
		path.unshift( getChildIndex( node ) );
		node = node.parentNode;
	}

	return path;
}

function resolvePath( path, rootNode ) {
	const index = path[ 0 ];

	if ( index === undefined || ! rootNode.hasChildNodes() ) {
		return;
	}

	const node = rootNode.childNodes[ index ];

	if ( ! node ) {
		return;
	}

	const newPath = drop( path );

	if ( node.nodeType === 3 ) {
		return { node, index: newPath[ 0 ] || 0 };
	}

	if ( newPath.length ) {
		return resolvePath( newPath, node );
	}

	return {
		node: node.parentNode,
		index: getChildIndex( node )
	};
}

export function rangeToState( {
	startOffset,
	startContainer,
	endOffset,
	endContainer,
	collapsed
}, rootNode ) {
	return {
		start: fillPath( [ startOffset ], startContainer, rootNode ),
		end: fillPath( [ endOffset ], endContainer, rootNode ),
		collapsed
	};
}

export function stateToRange( { start, end }, rootNode ) {
	if ( ! start || ! start.length ) {
		return;
	}

	const range = document.createRange();
	const startSet = resolvePath( start, rootNode );
	const endSet = resolvePath( end, rootNode );

	if ( ! startSet || ! endSet ) {
		return;
	}

	range.setStart( startSet.node, startSet.index );
	range.setEnd( endSet.node, endSet.index );

	return range;
}
