import React, { createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames';

import * as Icons from '../../external/dashicons'
import Dropbutton from '../dropbutton/Dropbutton'
import Button from '../button/Button'
import styles from './toolbar.scss'
import {isBold, isItalic, isDel, isLink} from '../../utils/tag'

const nodeOrParent = (pred, el) => (
	pred(el.nodeName) || (el.parentNode && pred(el.parentNode.nodeName))
)

const status = (pred, el) => (
	( el && nodeOrParent(pred, el) ) ? 'ACTIVE' : 'INACTIVE'
)

export default class Toolbar extends React.Component {

	render() {

		let sideToolbarStyles = cx(styles.toolbar, styles.sideToolbar)

		const H1Button = props => <Button><Icons.EditorHeadingIcon /></Button>
		const ParagraphButton = props => <Button><Icons.EditorParagraphIcon /></Button>
		const QuoteButton = props => <Button><Icons.EditorQuoteIcon /></Button>

		const AlignLeftButton = props => <Button><Icons.EditorAlignLeftIcon /></Button>
		const AlignRightButton = props => <Button><Icons.EditorAlignRightIcon /></Button>
		const AlignCenterButton = props => <Button><Icons.EditorAlignCenterIcon /></Button>

		return (
			<div>
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

				<div className={sideToolbarStyles} onMouseEnter={() => { }}>

					<Dropbutton status={'ACTIVE'}
						dropchoices={[<ParagraphButton />, <QuoteButton />]}
						hoverchoices={[
							<AlignLeftButton />,
							<AlignRightButton />,
							<AlignCenterButton />
						]}
						selected={<H1Button />} />


					<Dropbutton status={'INACTIVE'}
						dropchoices={[<H1Button />, <QuoteButton />]}
						hoverchoices={[
							<AlignLeftButton />,
							<AlignRightButton />,
							<AlignCenterButton />
						]}
						selected={<ParagraphButton />} />


					<Dropbutton status={'INACTIVE'}
						dropchoices={[<H1Button />, <ParagraphButton />]}
						hoverchoices={[
							<AlignLeftButton />,
							<AlignRightButton />,
							<AlignCenterButton />
						]}
						selected={<QuoteButton />} />


				</div>
			</div>
		)
	}
}