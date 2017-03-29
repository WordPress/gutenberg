import React, { createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames';

import * as Icons from '../../external/dashicons'
import BlockChangeToolbar from './BlockChangeToolbar'
import BlockAlignToolbar from './BlockAlignToolbar'
import Button from '../button/Button'
import styles from './blocktoolbar.scss'

export default class BlockToolbar extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			open: false
		}

		this.pos = this.props.pos
	}

	render() {
		if (this.props.pos) {
			this.pos = this.props.pos;
		}

		let pos = this.props.pos || this.pos;

		// TODO: add option types
		return (this.props.isOpen && pos) ? (
			<div style={ pos }>
				<div className={styles.toolbar}
						onMouseEnter={() => { this.setState({ open: true }) }}
						onMouseLeave={ () => { this.setState({ open: false }) } }
						>
					<BlockAlignToolbar  isOpen={this.state.open} selected={this.props.blockAlign} />
					<BlockChangeToolbar selected={this.props.blockType} />
				</div>
			</div>
		)
		: null
	}
}