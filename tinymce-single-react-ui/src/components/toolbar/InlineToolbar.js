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

/*
var sel = window.getSelection();
					if (!sel.isCollapsed) {
						var toolbar = this.getEl();
						var toolbarRect = toolbar.getBoundingClientRect();
						var selRange = sel.getRangeAt(0);
						var startRange = selRange.cloneRange();
						startRange.setEnd(startRange.startContainer, startRange.startOffset);
						var selRect = startRange.getBoundingClientRect();

						DOM.setStyles( toolbar, {
							position: 'absolute',
							left: selRect.left - 10 + 'px',
							top: selRect.top + window.pageYOffset - toolbarRect.height - 10 + 'px'
						} );

.insert-toolbar svg {
	background: #fff;
	border-radius: 12px;
}

						*/
export default class InlineToolbar extends React.Component {
	render() {
		let topLeft = this.props.targetTopLeft
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