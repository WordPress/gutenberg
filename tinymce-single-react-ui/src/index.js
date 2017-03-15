import '../../shared/post-content'
import 'assets/stylesheets/main.scss'
import React, { createElement, Component } from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import { connect, Provider } from 'react-redux'
import * as Icons from './external/dashicons/index'
import BlockChangeToolbar from './components/toolbar/BlockChangeToolbar'
import BlockToolbar from './components/toolbar/BlockToolbar'
import InlineToolbar from './components/toolbar/InlineToolbar'
import TinyMCEReactUI from './components/tinymce/tinymce-react-ui'
import action from './reducers/tinymce/tinymce-react-ui'
import {blockList, blockType, blockAlign, getTopLevelBlock} from './utils/tag'

const store = createStore(action)

let blockOpen  = (collapsed) => (collapsed !== null &&  collapsed) // block  if caret
let inlineOpen = (collapsed) => (collapsed !== null && !collapsed) // inline if range selection

let findBlockType = (editorNode, node) => {
	if (editorNode && editorNode.children.length > 0 && node) {
		let top = getTopLevelBlock(editorNode.children[0], node)
		let topType = blockType(top)
	  console.log('>> BLOCK=', topType, top && top.nodeName)
		return topType
	}
}

let findStartOfRange = (range) => {
	// make a collapsed range at the start point
	if (range) {
		let r = range.cloneRange();
		r.setEnd(range.startContainer, range.startOffset);
		let rect = r.getBoundingClientRect();
		return { top: rect.top, left: rect.left }
	} else {
		return { top: 0, left: 0 }
	}
}

const renderApp = () => render(
		<div data='TODO-this-is-the-new-app'>
			<div>
				<InlineToolbar isOpen={ inlineOpen(store.getState().get('collapsed')) }
					rangeTopLeft={ findStartOfRange(store.getState().get('range')) }
					pageYOffset={ window.pageYOffset }
					/>
				<BlockToolbar  isOpen={ blockOpen(store.getState().get('collapsed')) }
				 	blockType={ findBlockType(store.getState().get('editorRef'), store.getState().get('node')) }
					blockAlign={ blockAlign(store.getState().get('node')) }
				 />
			</div>
			<TinyMCEReactUI content={window.content}
				onSetup={ ( editorRef ) => store.dispatch( { type: 'SETUP', val: editorRef } ) }
				onFocus={ ( collapsed, bookmark, node ) => store.dispatch( { type: 'FOCUS', val: [collapsed, bookmark, node] } ) }
				onBlur={ ( collapsed, bookmark, node ) => store.dispatch( { type: 'BLUR', val: [collapsed, bookmark, node] } ) }
				onNodeChange={ ( collapsed, bookmark, node, event ) => store.dispatch( { type: 'NODECHANGE', val: [collapsed, bookmark, node, event] } ) }
				/>
		</div>
	,
	document.getElementById('tiny-react')
);

renderApp()
store.subscribe(renderApp)

// TODO: wrap the app in a provider and add the react-redux stuff	<Provider store={store}>
