import React, { createElement, Component } from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux'
import Turducken from './Turducken';
import action from './reducers/action'

const store = createStore(action)

const render = () => ReactDOM.render(
		<Turducken store={store}/>
		, document.getElementById('tiny-react')
	);

render()
store.subscribe(render)

// TODO: wrap Turducken in a Provider and add the react-redux stuff
