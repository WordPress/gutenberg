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
		console.log('%c', 'background: lime; font-size: 20px;', this.props.isOpen)
		return this.props.isOpen ? null : (
			<div className={styles.toolbar} onMouseEnter={() => { }}>

				<BlockChangeToolbar isOpen={true} choices={['p','h','blockquote']} selected={'p'} />
				<BlockAlignToolbar isOpen={true} choices={['left','right','center']} selected={'left'} />


			</div>
		)
	}
}