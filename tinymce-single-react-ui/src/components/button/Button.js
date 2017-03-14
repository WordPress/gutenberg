import React, { createElement, Component } from 'react';
import ReactDOM from 'react-dom';
import styles from './button.scss';

export default class Button extends React.Component {
	constructor(props) {
		super(props)
	}

	render() {
		return (
			<div className={styles.button}> { this.props.children } </div>
		)
	}
}