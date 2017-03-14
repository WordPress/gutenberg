import '../../shared/post-content'
import 'assets/stylesheets/main.scss'
import React, { createElement, Component } from 'react'
import { render } from 'react-dom'
import * as Icons from './external/dashicons/index'
import Toolbar from './components/toolbar/Toolbar'
import TinyMCEReactUI from './components/tinymce/tinymce-react-ui'

// ////////////////////////////////
import { createStore } from 'redux'
import Counter from './components/tinymce/components/Counter'
import counter from './components/tinymce/reducers/counter'

const store = createStore(counter)

const renderIt = () => render(
  <Counter
    value={store.getState()}
    onIncrement={() => store.dispatch({ type: 'INCREMENT' })}
    onDecrement={() => store.dispatch({ type: 'DECREMENT' })}
  />,
  document.getElementById('root')
)

renderIt()
store.subscribe(renderIt)
// ////////////////////////////////


render(
	<div>
		<Toolbar />
		<TinyMCEReactUI content={window.content} />
		<hr />
		<br />
	</div>,
	document.getElementById('tiny-react')
);
