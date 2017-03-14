import React, { createElement, Component } from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';

import styles from './dropbutton.scss';
import Button from '../button/Button'


export default class Dropbutton extends React.Component {
	constructor(props) {
		super(props)
    this.state = {
      hoverOpen: false,
      click: false
    }

	}

	render() {
    let status = this.props.status;
    let choices = status === 'ACTIVE' ? this.props.choices : [];
    let active = this.props.active;

		return (
        <div>
        {choices.map( (type) => (this.props.selected) )}
        </div>
		)
	}
}



// return (
      /*<div onMouseEnter={() => { this.setState( { hoverOpen: true } )}} onMouseLeave={() => { this.setState( { hoverOpen: false } )}}>
        { this.state.hoverOpen ? <div>Appears on hover</div> : false }
			  <div> { this.props.children } </div>
        <div>Appears on click</div>
      </div>
		)*/