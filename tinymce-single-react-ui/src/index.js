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

const renderApp = () => render(
		<div data='TODO-this-is-the-new-app'>
			<InlineToolbar selection={store.getState().get('selection')} node={store.getState().get('node')}/>
			<BlockToolbar selection={store.getState().get('selection')} node={store.getState().get('node')}/>
			<TinyMCEReactUI content={window.content}
				onFocus={ ( bookmark, node ) => store.dispatch( { type: 'FOCUS', val: [bookmark, node] } ) }
				onBlur={ ( bookmark, node ) => store.dispatch( { type: 'BLUR', val: [bookmark, node] } ) }
				onNodeChange={ ( bookmark, node, event ) => store.dispatch( { type: 'NODECHANGE', val: [bookmark, node, event] } ) }
				/>
		</div>
	,
	document.getElementById('tiny-react')
);

renderApp()
store.subscribe(renderApp)

// TODO: wrap the app in a provider and add the react-redux stuff	<Provider store={store}>