import React, { createElement, Component } from 'react';
import ReactDOM from 'react-dom';
import styles from './button.scss';
import cx from 'classnames'

export default function Button(props) {
	let extraClass = props.extraClass && props.extraClass.length > 0 ? props.extraClass.join(' ') : '';

	let classMap = {
		ACTIVE: styles.active,
		INACTIVE: styles.inactive,
		DISABLED: styles.disabled
	};

	let buttonClasses = cx(
		styles.button,
		classMap[props.status] || styles.inactive,
		extraClass
	)

	return (
		<div className={buttonClasses}> { props.children } </div>
	)
}
