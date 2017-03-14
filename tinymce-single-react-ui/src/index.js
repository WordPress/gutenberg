import '../../shared/post-content'
import 'assets/stylesheets/main.scss'
import React, { createElement, Component } from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import * as Icons from './external/dashicons/index'
import Toolbar from './components/toolbar/Toolbar'
import TinyMCEReactUI from './components/tinymce/tinymce-react-ui'
import action from './reducers/tinymce/tinymce-react-ui'

const store = createStore(action)

const renderApp = () => render(
	<div>
		<Toolbar />
		<TinyMCEReactUI content={window.content}
			onFocus={ ( bookmark, node ) => store.dispatch( { type: 'FOCUS', val: [bookmark, node] } ) }
			onBlur={ ( bookmark, node ) => store.dispatch( { type: 'BLUR', val: [bookmark, node] } ) }
			/>
		<hr />
		<br />
	</div>,
	document.getElementById('tiny-react')
);

renderApp()
store.subscribe(renderApp)

/*
		<Counter
			value={store.getState()}
			onIncrement={() => store.dispatch({ type: 'INCREMENT' })}
			onDecrement={() => store.dispatch({ type: 'DECREMENT' })}
		/>
*/