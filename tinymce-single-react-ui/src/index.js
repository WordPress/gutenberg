/**
 * External dependencies
 */
import '../../shared/post-content';

import React, { createElement, Component } from 'react';
import { render } from 'react-dom';

import TinyMCEReactUI from 'tinymce-react/tinymce-react-ui';

const BoldIcon = React.createClass({
	render() {
		<div>

		</div>
	}
})


class Button extends Component {
	constructor(props){
		super(props)
	}

	render() {
		return (
			<div className="button">{this.props.name}</div>
		)
	}
}

class Toolbar extends Component {
	render(){
		return (
			<div><Button name="I"/><Button name="U"/><Button name="B"/></div>
		)
	}
}


render(
	<div>
		<Toolbar />
		<TinyMCEReactUI content={window.content}/>
		<hr />
		<br/>
	</div>,
	document.getElementById('tiny-react')
);

