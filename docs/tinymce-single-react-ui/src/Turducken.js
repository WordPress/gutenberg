import React, { createElement, Component } from 'react'
import { render } from 'react-dom'
import * as Icons from './external/dashicons/index'
import BlockChangeToolbar from './components/toolbar/BlockChangeToolbar'
import BlockToolbar from './components/toolbar/BlockToolbar'
import InlineToolbar from './components/toolbar/InlineToolbar'
import Box from './components/box/Box'
import TinyMCEReact from './components/tinymce/tinymce-react-ui'
import {blockList, blockType, blockAlign, getTopLevelBlock} from './utils/tag'
import actions from './actions/content'
import '../../shared/post-content'
import 'assets/stylesheets/main.scss'

let blockOpen  = ( focused, collapsed ) => ( focused )               // block menu shown when focused
let inlineOpen = ( focused, collapsed ) => ( focused && !collapsed ) // inline if range selection

// get tiny node from the container, and the top level block from the caret node
let tinyNode = (containerNode) => ((containerNode && containerNode.children.length > 0) ? containerNode.children[0] : null)
let topLevelBlock = (tinyNode, node) => ((tinyNode && node) ? getTopLevelBlock(tinyNode, node) : null)

// Rect for the Range
let rangeRect = (range) => {
	if (range) {
		return range.getBoundingClientRect();
	}
}

let blockMenuPos = (rect) => ( rect ? {position: 'absolute', top: rect.top - 38 + 'px', right: rect.left + 38 + 'px', zIndex: 23 } : {} )
let insertMenuPos = (rect) => ( rect ? {position: 'absolute', top: rect.top - 38 + 'px', left: rect.left + 38 + 'px'} : {} )

export default function Turducken(props) {
  let store = props.myStore
  let state = store.getState()
  let collapsed = state.collapsed
  let focused = state.focused
  let range = state.range
  let node =  state.node // node of caret or ancestor of range
  let editorRef = state.editorRef
  let tiny = tinyNode(editorRef)
  let topBlock = topLevelBlock(tiny, node)
  let topRect = rangeRect(topBlock)

  return (
    <div>
      <Box rect={topRect}/>
      <InlineToolbar isOpen={ inlineOpen(focused, collapsed) } myStore={ store }
        pos={ insertMenuPos(rangeRect(topBlock)) }
        node={ node }
        />
      <BlockToolbar  isOpen={ blockOpen(focused, collapsed) }
        blockType={ blockType(topBlock) }
        blockAlign={ blockAlign(topBlock) }
        pos={ blockMenuPos(rangeRect(topBlock)) }
        />
      <TinyMCEReact content={window.content}
        onSetup={ ( editorRef ) => store.dispatch( actions.setup(editorRef) ) }
        onNodeChange={ ( collapsed, bookmark, node, event ) => store.dispatch( actions.nodechange( collapsed, bookmark, node, event ) ) }
        onFocus={ ( collapsed, bookmark, node ) => store.dispatch( actions.focus( collapsed, bookmark, node ) ) }
        onBlur={ ( collapsed, bookmark, node ) => store.dispatch( actions.blur( collapsed, bookmark, node ) ) }
        />
    </div>
  )
}

// ////////
// Anna's style: InlineToolbar appears at the start of the current Range
let findStartOfRange = (range) => {
	// make a collapsed range at the start point
	if (range) {
		let r = range.cloneRange();
		r.setEnd(range.startContainer, range.startOffset);
		return r.getBoundingClientRect();
	}
}

let positionNearCursor = (range) => {
  if (range) {
    let r = findStartOfRange(range)
    return { position: 'absolute', left: r.left - 10 + 'px', top: r.top - 48 + window.pageYOffset + 'px' }
  }
}
// ////////
