import React, { createElement, Component } from 'react';
import ReactDOM from 'react-dom';
import * as Icons from '../external/dashicons';
import Button from './Button';


export default class Toolbar extends React.Component {
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