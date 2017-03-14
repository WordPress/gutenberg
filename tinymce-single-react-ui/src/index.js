/**
 * External dependencies
 */
import '../../shared/post-content';

import React, { createElement, Component } from 'react';
import * as Icons from './external/dashicons/index';
import { render } from 'react-dom';

import TinyMCEReactUI from 'tinymce-react/tinymce-react-ui';

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

