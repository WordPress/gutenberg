import React, { createElement, Component } from 'react';
import ReactDOM from 'react-dom';


export default class Button extends React.Component {
	constructor(props) {
		super(props)
	}

	render() {
		return (
			<div className="button"> { this.props.children } </div>
		)
	}
}