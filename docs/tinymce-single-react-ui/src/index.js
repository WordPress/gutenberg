import React, { createElement, Component } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import Turducken from './Turducken';
import content from './reducers/content'

const store = createStore(content)

const render = () => ReactDOM.render(
	<Provider store={store}>
		<Turducken myStore={store}/>
	</Provider>
		, document.getElementById('tiny-react')
	);

render()
store.subscribe(render)

// TODO: wrap Turducken in a Provider and add the react-redux stuff
