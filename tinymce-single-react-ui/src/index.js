/**
 * External dependencies
 */
import '../../shared/post-content';

import React, { createElement, Component } from 'react';
import * as Icons from './external/dashicons/index';
import { render } from 'react-dom';

import TinyMCEReactUI from 'tinymce-react/tinymce-react-ui';

// ////////////////////////////////
import { createStore } from 'redux'
import Counter from './tinymce-react/components/Counter'
import counter from './tinymce-react/reducers/counter'

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

class Button extends Component {
	constructor(props) {
		super(props)
	}

	render() {
		return (
			<div className="button"> { this.props.children } </div>
		)
	}
}

class Toolbar extends Component {
	render() {
		return (
			<div>
				<Button>
					<Icons.EditorBoldIcon />
				</Button>
				<Button>
					<Icons.EditorItalicIcon />
				</Button>
				<Button>
					<Icons.EditorStrikethroughIcon />
				</Button>
			</div>
		)
	}
}


render(
	<div>
		<Toolbar />
		<TinyMCEReactUI content={window.content} />
		<hr />
		<br />
	</div>,
	document.getElementById('tiny-react')
);
