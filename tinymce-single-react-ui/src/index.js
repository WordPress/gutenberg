import '../../shared/post-content'
import 'assets/stylesheets/main.scss'
import React, { createElement, Component } from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import { connect, Provider } from 'react-redux'
import * as Icons from './external/dashicons/index'
import BlockToolbar from './components/toolbar/BlockToolbar'
import InlineToolbar from './components/toolbar/InlineToolbar'
import TinyMCEReactUI from './components/tinymce/tinymce-react-ui'
import action from './reducers/tinymce/tinymce-react-ui'

const store = createStore(action)

let blockOpen = (collapsed) => {
	console.log(collapsed, ' <<<<<<<<< <<<< < << < < <')
	return (collapsed === null || !collapsed)
}
let inlineOpen = (collapsed) => (collapsed === null || collapsed)
let blockMap = {P: 'p', H1: 'h', H2: 'h', BLOCKQUOTE: 'blockquote'}
let blockList = ['p', 'h', 'blockquote']
// TODO: dont default 'p' for unsupported tag
let blockType = (el) => ( (el && blockMap[el.nodeName]) || 'p')

const renderApp = () => render(
		<div data='TODO-this-is-the-new-app'>
			<div style={{position : 'relative'}}>

				<BlockToolbar isOpen={ blockOpen(store.getState().get('collapsed')) }
				 choices={ blockList }
				 selected={ blockType(store.getState().get('node'))}/>
			</div>
			<TinyMCEReactUI content={window.content}
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

// {/*<InlineToolbar isOpen={ inlineOpen(store.getState().get('collapsed')) } node={store.getState().get('node')}/>*/}