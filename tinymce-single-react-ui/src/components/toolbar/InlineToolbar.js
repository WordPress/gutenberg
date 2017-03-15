import React, { createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames';

import * as Icons from '../../external/dashicons'
import Dropbutton from '../dropbutton/Dropbutton'
import Button from '../button/Button'

import {isBold, isItalic, isDel, isLink} from '../../utils/tag'
import styles from './inlinetoolbar.scss'


const nodeOrParent = (pred, el) => {
	console.log('>>>>>> <><><>>>', pred(el.nodeName))
	return pred(el.nodeName) || (el.parentNode && pred(el.parentNode.nodeName))
}

const status = (pred, el) => {
	console.log('element: ', el)
	return ( el && nodeOrParent(pred, el) ) ? 'ACTIVE' : 'INACTIVE'
}

export default class InlineToolbar extends React.Component {
	render() {
		// TODO: add option types
		return this.props.isOpen ? (
			<div className={styles.toolbarWrapper}>
				<div className={styles.toolbar}>
					<Button status={ status( isBold, this.props.node ) } >
						<Icons.EditorBoldIcon />
					</Button>
					<Button status={ status( isItalic, this.props.node ) } >
						<Icons.EditorItalicIcon />
					</Button>
					<Button status={ status( isDel, this.props.node ) } >
						<Icons.EditorStrikethroughIcon />
					</Button>
				</div>
			</div>
		)
		: null
	}
}