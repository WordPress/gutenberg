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
	}
	render() {
		// TODO: add option types
		return this.props.isOpen ? (
			<div className={styles.toolbar} onMouseEnter={() => { }}>
				<BlockChangeToolbar isOpen={true} selected={this.props.blockType} />
				<BlockAlignToolbar  isOpen={true} selected={this.props.blockAlign} />
			</div>
		)
		: null
	}
}