import React, { createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import * as Icons from '../external/dashicons'

const member = (arr, item) => (
	arr.indexOf(item) !== -1
)
// determine node styles 'strong,b,em,i,del,a[href]'
export const isBold = (tag) => member( [ 'STRONG', 'B' ], tag )
export const isItalic = (tag) => member( [ 'EM', 'I' ], tag )
export const isDel = (tag) => member( [ 'DEL' ], tag )
export const isLink = (tag) => member( [ 'A' ], tag )

// valid blocks
export const blockMap = {P: 'p', H1: 'h', H2: 'h', BLOCKQUOTE: 'blockquote'}
export const blockList = ['p', 'h', 'blockquote']
export const blockIconMap = {
	'p': <Icons.EditorParagraphIcon />,
	'h': <Icons.EditorHeadingIcon />,
	'blockquote': <Icons.EditorQuoteIcon />,
}
// export const blockAlignMap = {}
export const blockAlignList = ['left', 'right', 'center']
export const blockAlignIconMap = {
	'left': <Icons.EditorAlignLeftIcon />,
	'center': <Icons.EditorAlignCenterIcon />,
	'right': <Icons.EditorAlignRightIcon />
}

// TODO: dont default 'p' for unsupported tag
export const blockType = (el) => ( (el && blockMap[el.nodeName]) || 'p')
// TODO: implement query for element 'alignment'
export const blockAlign = (el) => ( 'left' )


// Find the top-level block (rootNode === editor.getBody())
export const getTopLevelBlock = ( rootNode, node ) => {
	if ( node === rootNode || ! rootNode.contains( node ) ) {
		return null;
	}

	while ( node.parentNode !== rootNode ) {
		node = node.parentNode;
	}

	return node;
}
