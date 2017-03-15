import React, { createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames';

import * as Icons from '../../external/dashicons'
import Dropbutton from '../dropbutton/Dropbutton'
import Button from '../button/Button'

import {isBold, isItalic, isDel, isLink} from '../../utils/tag'
import styles from './inlinetoolbar.scss'


const nodeOrParent = (pred, el) => (
	pred(el.nodeName) || (el.parentNode && pred(el.parentNode.nodeName))
)

const status = (pred, el) => (
	( el && nodeOrParent(pred, el) ) ? 'ACTIVE' : 'INACTIVE'
)

export default class InlineToolbar extends React.Component {
	render() {
		let top = this.props.rangeTopLeft.top
		let left = this.props.rangeTopLeft.left
		let offset = this.props.pageYOffset

		// TODO: add option types
		return this.props.isOpen ? (
			<div className={styles.toolbarWrapper}
				style={{position: 'absolute',
				 				left: (left - 10 + 'px'),
              	top: (top + offset - 48 + 'px')}}
				>
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
