import React, { createElement, Component } from 'react'
import { render } from 'react-dom'
import * as Icons from './external/dashicons/index'
import BlockChangeToolbar from './components/toolbar/BlockChangeToolbar'
import BlockToolbar from './components/toolbar/BlockToolbar'
import InlineToolbar from './components/toolbar/InlineToolbar'
import TinyMCEReact from './components/tinymce/tinymce-react-ui'
import {blockList, blockType, blockAlign, getTopLevelBlock} from './utils/tag'
import '../../shared/post-content'
import 'assets/stylesheets/main.scss'

let blockOpen  = (collapsed) => (collapsed !== null &&  collapsed) // block  if caret
let inlineOpen = (collapsed) => (collapsed !== null && !collapsed) // inline if range selection

// get tiny node from the container, and the top level block from the caret node
let tinyNode = (containerNode) => ((containerNode && containerNode.children.length > 0) ? containerNode.children[0] : null)
let topLevelBlock = (tinyNode, node) => ((tinyNode && node) ? getTopLevelBlock(tinyNode, node) : null)

// Rect at the start of the Range
let findStartOfRange = (range) => {
	// make a collapsed range at the start point
	if (range) {
		let r = range.cloneRange();
		r.setEnd(range.startContainer, range.startOffset);
		return r.getBoundingClientRect();
	}
}

// Rect for the Range
let rangeRect = (range) => {
	if (range) {
		return range.getBoundingClientRect();
	}
}

export default function Turducken(props) {
  let store = props.store
  let collapsed = store.getState().get('collapsed')
  let range = store.getState().get('range')
  let node =  store.getState().get('node') // node of caret or ancestor of range
  let editorRef = store.getState().get('editorRef')
  let tiny = tinyNode(editorRef)
  let topBlock = topLevelBlock(tiny, node)

  return (
    <div>
      <div>
        <InlineToolbar isOpen={ inlineOpen(collapsed) }
          rangeRect={ findStartOfRange(range) }
          pageYOffset={ window.pageYOffset }
          node={ node }
          />
        <BlockToolbar  isOpen={ blockOpen(collapsed) }
          blockType={ blockType(topBlock) }
          blockAlign={ blockAlign(topBlock) }
          blockRect={ rangeRect(topBlock) }
          />
      </div>
      <TinyMCEReact content={window.content}
        onSetup={ ( editorRef ) => store.dispatch( { type: 'SETUP', val: editorRef } ) }
        onFocus={ ( collapsed, bookmark, node ) => store.dispatch( { type: 'FOCUS', val: [collapsed, bookmark, node] } ) }
        onBlur={ ( collapsed, bookmark, node ) => store.dispatch( { type: 'BLUR', val: [collapsed, bookmark, node] } ) }
        onNodeChange={ ( collapsed, bookmark, node, event ) => store.dispatch( { type: 'NODECHANGE', val: [collapsed, bookmark, node, event] } ) }
        />
    </div>
  )
}