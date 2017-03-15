import React, { createElement, Component } from 'react'
import { render } from 'react-dom'
import * as Icons from './external/dashicons/index'
import BlockChangeToolbar from './components/toolbar/BlockChangeToolbar'
import BlockToolbar from './components/toolbar/BlockToolbar'
import InlineToolbar from './components/toolbar/InlineToolbar'
import TinyMCEReact from './components/tinymce/tinymce-react-ui'
import action from './reducers/tinymce/tinymce-react-ui'
import {blockList, blockType, blockAlign, getTopLevelBlock} from './utils/tag'
import '../../shared/post-content'
import 'assets/stylesheets/main.scss'

let blockOpen  = (collapsed) => (collapsed !== null &&  collapsed) // block  if caret
let inlineOpen = (collapsed) => (collapsed !== null && !collapsed) // inline if range selection

let findBlockType = (editorNode, node) => {
	if (editorNode && editorNode.children.length > 0 && node) {
		let top = getTopLevelBlock(editorNode.children[0], node)
		let topType = blockType(top)
		return topType
	}
}

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

export default class Turducken extends React.Component {
  render() {
    let store = this.props.store
    return (
      <div>
        <div>
          <InlineToolbar isOpen={ inlineOpen(store.getState().get('collapsed')) }
            rangeRect={ findStartOfRange(store.getState().get('range')) }
            pageYOffset={ window.pageYOffset }
            node={ store.getState().get('node') }
            />
          <BlockToolbar  isOpen={ blockOpen(store.getState().get('collapsed')) }
            blockType={ findBlockType(store.getState().get('editorRef'), store.getState().get('node')) }
            blockAlign={ blockAlign(store.getState().get('node')) }
            blockRect={ rangeRect(store.getState().get('node')) }
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
}