import React, { createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames';

import * as Icons from '../../external/dashicons'
import Dropbutton from '../dropbutton/Dropbutton'
import Button from '../button/Button'
import styles from './inlinetoolbar.scss'
import {isBold, isItalic, isDel, isLink} from '../../utils/tag'

const nodeOrParent = (pred, el) => (
	pred(el.nodeName) || (el.parentNode && pred(el.parentNode.nodeName))
)

const status = (pred, el) => (
	( el && nodeOrParent(pred, el) ) ? 'ACTIVE' : 'INACTIVE'
)

export default class InlineToolbar extends React.Component {
	render() {
		// TODO: add option types
		let hidden = !this.props.selection || this.props.selection.isCollapsed()

		return (
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
	}
}