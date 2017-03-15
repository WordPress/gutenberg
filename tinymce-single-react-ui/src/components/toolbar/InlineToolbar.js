import React, { createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames';

import * as Icons from '../../external/dashicons'
import Dropbutton from '../dropbutton/Dropbutton'
import Button from '../button/Button'

import {isBold, isItalic, isDel, isLink} from '../../utils/tag'
import styles from './inlinetoolbar.scss'


const nodeOrParent = (pred, el) => {
	return pred(el.nodeName) || (el.parentNode && pred(el.parentNode.nodeName))
}

const status = (pred, el) => {
	return ( el && nodeOrParent(pred, el) ) ? 'ACTIVE' : 'INACTIVE'
}

export default class InlineToolbar extends React.Component {
	render() {
		let top = this.props.rangeRect ? this.props.rangeRect.top : 0
		let left = this.props.rangeRect ? this.props.rangeRect.left : 0
		let offset = this.props.pageYOffset || 0
		let node = this.props.node

		// TODO: add option types
		return this.props.isOpen ? (
			<div className={styles.toolbarWrapper}
				style={{position: 'absolute',
				 				left: (left - 10 + 'px'),
              	top: (top + offset - 48 + 'px')}}
				>
				<div className={styles.toolbar}>
					<Button status={ status( isBold, node ) } >
						<Icons.EditorBoldIcon />
					</Button>
					<Button status={ status( isItalic, node ) } >
						<Icons.EditorItalicIcon />
					</Button>
					<Button status={ status( isDel, node ) } >
						<Icons.EditorStrikethroughIcon />
					</Button>
				</div>
			</div>
		)
		: null
	}
}
