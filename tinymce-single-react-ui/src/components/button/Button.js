import React, { createElement, Component } from 'react';
import ReactDOM from 'react-dom';
import styles from './button.scss';
import cx from 'classnames'

export default class Button extends React.Component {
	constructor(props) {
		super(props)
	}

	render() {
		let extraClass = this.props.extraClass && this.props.extraClass.length > 0 ? this.props.extraClass.join(' ') : '';

		let classMap = {
			ACTIVE: styles.active,
			INACTIVE: styles.inactive,
			DISABLED: styles.disabled
		};

		let buttonClasses = cx(
			styles.button,
			classMap[this.props.status] || styles.inactive,
			extraClass
		)

		return (
			<div className={buttonClasses}> { this.props.children } </div>
		)
	}
}