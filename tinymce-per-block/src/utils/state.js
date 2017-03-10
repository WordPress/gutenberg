export const removeBlockFromState = ( state, index ) => {
	return Object.assign( {}, state, {
		blocks: [
			...state.blocks.slice( 0, index ),
			...state.blocks.slice( index + 1 ),
		]
	} );
};

export const mergeInlineTextBlocks = ( state, index ) => {
	const getLeaves = html => {
		const div = document.createElement( 'div' );
		div.innerHTML = html;
		if ( div.childNodes.length === 1 && div.firstChild.nodeName === 'P' ) {
			return getLeaves( div.firstChild.innerHTML );
		}
		return html;
	};
	const currentBlock = state.blocks[ index ];
	const blockToMerge = state.blocks[ index + 1 ];
	const newBlock = Object.assign( {}, currentBlock, {
		content: getLeaves( currentBlock.content ) + getLeaves( blockToMerge.content ),
		externalChange: ( currentBlock.externalChange || 0 ) + 1
	} );
	const newBlocks = [
		...state.blocks.slice( 0, index ),
		newBlock,
		...state.blocks.slice( index + 2 )
	];
	return Object.assign( {}, state, {
		blocks: newBlocks,
		focus: { uid: newBlock.uid, config: { end: true } }
	} );
};
