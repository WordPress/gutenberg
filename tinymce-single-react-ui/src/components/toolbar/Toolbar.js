import React, { createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames';


import * as Icons from '../../external/dashicons'
import Dropbutton from '../dropbutton/Dropbutton'
import Button from '../button/Button'
import styles from './toolbar.scss'

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
			<div className={styles.toolbarWrapper}>
				<div className={styles.toolbar}>
					<Button status={'ACTIVE'}>
						<Icons.EditorBoldIcon />
					</Button>
					<Button status={'INACTIVE'}>
						<Icons.EditorItalicIcon />
					</Button>
					<Button>
						<Icons.EditorStrikethroughIcon />
					</Button>
				</div>

				<div className={sideToolbarStyles} onMouseEnter={() => { }}>

					<Dropbutton status={'ACTIVE'}
						dropchoices={[<ParagraphButton key="pbutton" />, <QuoteButton key="qbutton" />]}
						hoverchoices={[
							<AlignLeftButton />,
							<AlignRightButton />,
							<AlignCenterButton />
						]}
						selected={<H1Button key="h1button" />} />


					<Dropbutton status={'INACTIVE'}
						dropchoices={[<H1Button key="h1button" />, <QuoteButton key="qbutton" />]}
						hoverchoices={[
							<AlignLeftButton />,
							<AlignRightButton />,
							<AlignCenterButton />
						]}
						selected={<ParagraphButton key="pbutton" />} />


					<Dropbutton status={'INACTIVE'}
						dropchoices={[<H1Button key="h1button" />, <ParagraphButton key="pbutton" />]}
						hoverchoices={[
							<AlignLeftButton />,
							<AlignRightButton />,
							<AlignCenterButton />
						]}
						selected={<QuoteButton key="qbutton" />} />


				</div>
			</div>
		)
	}
}