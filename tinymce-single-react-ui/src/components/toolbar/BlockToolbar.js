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

		this.blockRect = this.props.blockRect
	}

	render() {
		if (this.props.blockRect) {
			this.blockRect = this.props.blockRect;
		}

		let rect = this.props.blockRect || this.blockRect;

		// TODO: add option types
		return (this.props.isOpen && rect) ? (
			<div style={ { position: 'absolute', top: rect.top - 38 + 'px', right: rect.left + 38 + 'px', zIndex: 23 } }>
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