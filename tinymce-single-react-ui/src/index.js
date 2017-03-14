import '../../shared/post-content'
import 'assets/stylesheets/main.scss'
import React, { createElement, Component } from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import { connect, Provider } from 'react-redux'
import * as Icons from './external/dashicons/index'
import Toolbar from './components/toolbar/Toolbar'
import TinyMCEReactUI from './components/tinymce/tinymce-react-ui'
import action from './reducers/tinymce/tinymce-react-ui'

const store = createStore(action)

const renderApp = () => render(
	<Provider store={store}>
		<div data='TODO-this-is-the-new-app'>
			<Toolbar node={store.getState().get('node')}/>
			<TinyMCEReactUI content={window.content}
				onFocus={ ( bookmark, node ) => store.dispatch( { type: 'FOCUS', val: [bookmark, node] } ) }
				onBlur={ ( bookmark, node ) => store.dispatch( { type: 'BLUR', val: [bookmark, node] } ) }
				onNodeChange={ ( bookmark, node, event ) => store.dispatch( { type: 'NODECHANGE', val: [bookmark, node, event] } ) }
				/>
		</div>
	</Provider>
	,
	document.getElementById('tiny-react')
);

renderApp()
store.subscribe(renderApp)
