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

		return (
			<div>
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

				<div className={sideToolbarStyles} onMouseEnter={ () => { } }>

						<Dropbutton status={'ACTIVE'} choices={[<H1Button />,<ParagraphButton />,<QuoteButton />]} selected={<H1Button />} />
						<Dropbutton status={'INACTIVE'} choices={[<H1Button />,<ParagraphButton />,<QuoteButton />]} selected={<ParagraphButton />} />
						<Dropbutton status={'INACTIVE'} choices={[<H1Button />,<ParagraphButton />,<QuoteButton />]} selected={<QuoteButton />} />

						<Button>
							<Icons.EditorAlignLeftIcon />
						</Button>
						<Button>
							<Icons.EditorAlignCenterIcon />
						</Button>
						<Button>
							<Icons.EditorAlignRightIcon />
						</Button>
						<Button>
							<Icons.EditorParagraphIcon />
						</Button>
				</div>
			</div>
		)
	}
}